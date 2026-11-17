-- Fonctions limitées à la session psql, sans installation applicative.
\ir delete-arrondissements-paris-marseille.rules.sql

CREATE OR REPLACE FUNCTION pg_temp.delete_arrondissements_paris_marseille(
    apply boolean DEFAULT false
) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
    target_ids integer[];
    city_ids integer[];
    target record;
    dependency record;
    rule record;
    reference_count bigint;
    changed_count bigint;
    deleted_count integer := 0;
    blocked boolean := false;
    cleanup_id uuid := gen_random_uuid();
    archive_table constant text := 'private.arrondissements_paris_marseille_cleanup';
    qualified_name text;
    role_name text;
    archive_complete boolean;
    locked_relations regclass[] := ARRAY[]::regclass[];
BEGIN
    IF apply IS NULL THEN
        RAISE EXCEPTION 'Le mode apply doit être true ou false';
    END IF;
    -- Échouer plutôt que masquer des données derrière une politique RLS.
    PERFORM set_config('row_security', 'off', true);

    IF apply THEN
        LOCK TABLE public.collectivite, public.collectivite_bucket IN SHARE ROW EXCLUSIVE MODE;
        LOCK TABLE storage.objects IN SHARE MODE;
        locked_relations := ARRAY[
            'public.collectivite'::regclass,
            'public.collectivite_bucket'::regclass,
            'storage.objects'::regclass
        ];
    END IF;

    SELECT coalesce(array_agg(id ORDER BY id), ARRAY[]::integer[])
    INTO target_ids FROM public.collectivite
    WHERE type = 'commune' AND commune_code::text IN (
        SELECT code::text FROM generate_series(13201, 13216) AS code
        UNION ALL SELECT code::text FROM generate_series(75101, 75120) AS code
    );
    FOR target IN
        SELECT id, nom, commune_code FROM public.collectivite
        WHERE id = ANY(target_ids) ORDER BY commune_code
    LOOP
        RAISE NOTICE 'Espace ciblé : #% | % | %', target.id, target.commune_code, target.nom;
    END LOOP;
    RAISE NOTICE '% espace(s) ciblé(s) sur les 36 codes autorisés', cardinality(target_ids);
    IF cardinality(target_ids) = 0 THEN RETURN 0; END IF;

    IF EXISTS (
        SELECT 1 FROM public.collectivite WHERE id = ANY(target_ids)
        GROUP BY commune_code HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Plusieurs espaces portent le même code arrondissement : arbitrage requis';
    END IF;
    SELECT array_agg(id ORDER BY commune_code) INTO city_ids FROM public.collectivite
    WHERE type = 'commune' AND commune_code::text IN ('13055', '75056');
    IF cardinality(city_ids) IS DISTINCT FROM 2 OR (
        SELECT count(DISTINCT commune_code) FROM public.collectivite WHERE id = ANY(city_ids)
    ) <> 2 THEN
        RAISE NOTICE 'BLOCAGE : un unique espace Ville est requis pour Marseille (13055) et Paris (75056)';
        blocked := true;
    END IF;

    -- Verrouiller aussi les tables sans données, avant de vérifier leur contenu.
    FOR dependency IN SELECT * FROM pg_temp.arrondissements_references() ORDER BY relation, column_name
    LOOP
        IF apply AND NOT dependency.relation = ANY(locked_relations) THEN
            EXECUTE format('LOCK TABLE %s IN SHARE ROW EXCLUSIVE MODE', dependency.relation);
            locked_relations := array_append(locked_relations, dependency.relation);
        END IF;
        SELECT * INTO rule FROM pg_temp.arrondissements_cleanup_rules() r WHERE r.relation = dependency.relation;
        EXECUTE format(
            'SELECT count(*) FROM %s t WHERE t.%I = ANY($1::%s[])
             AND NOT coalesce((%s), false)',
            dependency.relation, dependency.column_name, dependency.column_type,
            coalesce(rule.predicate, 'false')
        ) INTO reference_count USING target_ids;
        IF reference_count > 0 THEN
            RAISE NOTICE 'BLOCAGE : %.% | % ligne(s) hors du traitement prévu',
                dependency.relation, dependency.column_name, reference_count;
            blocked := true;
        END IF;
    END LOOP;

    FOR rule IN SELECT * FROM pg_temp.arrondissements_cleanup_rules() ORDER BY step
    LOOP
        IF apply AND NOT rule.relation = ANY(locked_relations) THEN
            EXECUTE format('LOCK TABLE %s IN SHARE ROW EXCLUSIVE MODE', rule.relation);
            locked_relations := array_append(locked_relations, rule.relation);
        END IF;
        EXECUTE format('SELECT count(*) FROM %s t WHERE %s', rule.relation, rule.predicate)
            INTO reference_count USING target_ids;
        IF reference_count > 0 THEN
            RAISE NOTICE 'TRAITEMENT : % | % | % ligne(s)', rule.relation, rule.operation, reference_count;
        END IF;
    END LOOP;
    blocked := pg_temp.arrondissements_check_children(target_ids, apply) OR blocked;

    FOR target IN
        SELECT link.collectivite_id, link.bucket_id, count(object.id) AS object_count
        FROM public.collectivite_bucket link
        LEFT JOIN storage.objects object ON object.bucket_id = link.bucket_id
        WHERE link.collectivite_id = ANY(target_ids)
        GROUP BY link.collectivite_id, link.bucket_id ORDER BY link.collectivite_id, link.bucket_id
    LOOP
        RAISE NOTICE 'Stockage : #% | bucket % | % objet(s)', target.collectivite_id, target.bucket_id, target.object_count;
        IF target.object_count > 0 THEN blocked := true; END IF;
    END LOOP;

    -- Un panier d'une autre collectivité ne devient pas supprimable parce que
    -- son filtre présélectionné référence un arrondissement.
    IF to_regclass('public.panier') IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM public.panier WHERE collectivite_preset = ANY(target_ids)
            AND collectivite_id IS NOT NULL AND NOT collectivite_id = ANY(target_ids)) THEN
            RAISE NOTICE 'BLOCAGE : un panier appartient à une collectivité hors périmètre';
            blocked := true;
        END IF;
    END IF;

    IF to_regclass('public.private_utilisateur_droit') IS NOT NULL AND cardinality(city_ids) = 2 THEN
        FOR target IN
            SELECT DISTINCT d.user_id, city.id AS city_id, existing.active, existing.id AS existing_id
            FROM public.private_utilisateur_droit d
            JOIN public.collectivite arrondissement ON arrondissement.id = d.collectivite_id
            JOIN public.collectivite city ON city.id = ANY(city_ids) AND city.commune_code::text =
                CASE WHEN arrondissement.commune_code::text LIKE '132%' THEN '13055' ELSE '75056' END
            LEFT JOIN public.private_utilisateur_droit existing
                ON existing.user_id = d.user_id AND existing.collectivite_id = city.id
            WHERE d.collectivite_id = ANY(target_ids) AND d.active AND existing.active IS DISTINCT FROM true
        LOOP
            IF target.existing_id IS NOT NULL THEN
                RAISE NOTICE 'BLOCAGE : droit Ville désactivé pour utilisateur % sur #% : ne pas réactiver automatiquement',
                    target.user_id, target.city_id;
                blocked := true;
            ELSE
                RAISE NOTICE 'DROIT : utilisateur % | Ville #% | création lecture', target.user_id, target.city_id;
            END IF;
        END LOOP;
    END IF;

    IF NOT apply THEN
        RAISE NOTICE 'Inventaire uniquement : aucune suppression. Blocage détecté : %', blocked;
        RETURN 0;
    END IF;
    IF blocked THEN
        RAISE EXCEPTION 'Suppression refusée : des dépendances hors périmètre ou des droits Ville nécessitent un arbitrage. Aucune suppression effectuée';
    END IF;

    -- Images intégrales, sans FK vers les lignes supprimées. Ne pas exposer
    -- cette archive administrative aux rôles des API, même avec leurs grants
    -- par défaut. La sauvegarde externe reste nécessaire pour une restauration.
    CREATE SCHEMA IF NOT EXISTS private;
    CREATE TABLE IF NOT EXISTS private.arrondissements_paris_marseille_cleanup (
        run_id uuid NOT NULL,
        source_table text NOT NULL,
        operation text NOT NULL CHECK (operation IN ('archive', 'transfer', 'grant')),
        phase text NOT NULL CHECK (phase IN ('before', 'removed', 'created')),
        row_data jsonb NOT NULL,
        archived_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    REVOKE ALL ON private.arrondissements_paris_marseille_cleanup FROM PUBLIC;
    FOR role_name IN SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated', 'service_role')
    LOOP
        EXECUTE format('REVOKE ALL ON %s FROM %I', archive_table, role_name);
    END LOOP;
    ALTER TABLE private.arrondissements_paris_marseille_cleanup ENABLE ROW LEVEL SECURITY;
    LOCK TABLE private.arrondissements_paris_marseille_cleanup IN SHARE ROW EXCLUSIVE MODE;

    -- Capturer les originaux avant toute écriture : supprimer une action d'un
    -- panier modifie par exemple latest_update sur le panier via un trigger.
    FOR rule IN SELECT * FROM pg_temp.arrondissements_cleanup_rules() ORDER BY step
    LOOP
        SELECT format('%I.%I', n.nspname, c.relname) INTO qualified_name
        FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.oid = rule.relation;
        EXECUTE format('SELECT count(*) FROM %s t WHERE %s', rule.relation, rule.predicate)
            INTO reference_count USING target_ids;
        EXECUTE format(
            'INSERT INTO %s (run_id, source_table, operation, phase, row_data)
             SELECT $2, $3, $4, ''before'', to_jsonb(t) FROM %s t WHERE %s',
            archive_table, rule.relation, rule.predicate
        ) USING target_ids, cleanup_id, qualified_name, rule.operation;
        GET DIAGNOSTICS changed_count = ROW_COUNT;
        IF changed_count <> reference_count THEN RAISE EXCEPTION 'Archive initiale incomplète de %', rule.relation; END IF;
    END LOOP;

    -- Créer seulement les droits absents, sans reprendre le niveau admin d'un
    -- arrondissement, réactiver un ancien droit ou changer un droit Ville.
    IF to_regclass('public.private_utilisateur_droit') IS NOT NULL THEN
        WITH added AS (
            INSERT INTO public.private_utilisateur_droit (user_id, collectivite_id, niveau_acces, active)
            SELECT DISTINCT d.user_id, city.id, 'lecture'::public.niveau_acces, true
            FROM public.private_utilisateur_droit d
            JOIN public.collectivite arrondissement ON arrondissement.id = d.collectivite_id
            JOIN public.collectivite city ON city.id = ANY(city_ids) AND city.commune_code::text =
                CASE WHEN arrondissement.commune_code::text LIKE '132%' THEN '13055' ELSE '75056' END
            WHERE d.collectivite_id = ANY(target_ids) AND d.active AND NOT EXISTS (
                SELECT 1 FROM public.private_utilisateur_droit existing
                WHERE existing.user_id = d.user_id AND existing.collectivite_id = city.id
            )
            RETURNING *
        ) INSERT INTO private.arrondissements_paris_marseille_cleanup (run_id, source_table, operation, phase, row_data)
          SELECT cleanup_id, 'public.private_utilisateur_droit', 'grant', 'created', to_jsonb(added) FROM added;
        IF EXISTS (
            SELECT 1 FROM public.private_utilisateur_droit d
            JOIN public.collectivite arrondissement ON arrondissement.id = d.collectivite_id
            JOIN public.collectivite city ON city.id = ANY(city_ids) AND city.commune_code::text =
                CASE WHEN arrondissement.commune_code::text LIKE '132%' THEN '13055' ELSE '75056' END
            WHERE d.collectivite_id = ANY(target_ids) AND d.active AND NOT EXISTS (
                SELECT 1 FROM public.private_utilisateur_droit existing
                WHERE existing.user_id = d.user_id AND existing.collectivite_id = city.id AND existing.active
            )
        ) THEN RAISE EXCEPTION 'Création des accès Ville incomplète'; END IF;
        IF EXISTS (
            SELECT 1 FROM private.arrondissements_paris_marseille_cleanup a
            LEFT JOIN public.private_utilisateur_droit d ON d.id = (a.row_data->>'id')::integer
            WHERE a.run_id = cleanup_id AND a.operation = 'grant'
                AND (d.id IS NULL OR d.niveau_acces <> 'lecture' OR NOT d.active
                    OR to_jsonb(d) IS DISTINCT FROM a.row_data)
        ) THEN RAISE EXCEPTION 'Un accès créé ne correspond pas au droit lecture prévu'; END IF;
    END IF;

    FOR rule IN SELECT * FROM pg_temp.arrondissements_cleanup_rules() ORDER BY step
    LOOP
        EXECUTE format('SELECT count(*) FROM %s t WHERE %s', rule.relation, rule.predicate)
            INTO reference_count USING target_ids;
        -- Qualifier le nom stocké indépendamment du search_path de l'opérateur.
        SELECT format('%I.%I', n.nspname, c.relname) INTO qualified_name
        FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.oid = rule.relation;

        IF rule.operation = 'transfer' THEN
            UPDATE public.fiche_action f SET collectivite_id = city.id
            FROM public.collectivite arrondissement, public.collectivite city
            WHERE f.collectivite_id = arrondissement.id AND arrondissement.id = ANY(target_ids)
                AND city.id = ANY(city_ids) AND city.commune_code::text =
                    CASE WHEN arrondissement.commune_code::text LIKE '132%' THEN '13055' ELSE '75056' END;
            GET DIAGNOSTICS changed_count = ROW_COUNT;
            IF EXISTS (
                SELECT 1 FROM private.arrondissements_paris_marseille_cleanup a
                JOIN public.collectivite arrondissement ON arrondissement.id = (a.row_data->>'collectivite_id')::integer
                JOIN public.collectivite city ON city.id = ANY(city_ids) AND city.commune_code::text =
                    CASE WHEN arrondissement.commune_code::text LIKE '132%' THEN '13055' ELSE '75056' END
                LEFT JOIN public.fiche_action f ON f.id = (a.row_data->>'id')::integer
                WHERE a.run_id = cleanup_id AND a.operation = 'transfer' AND (
                    f.id IS NULL OR f.collectivite_id IS DISTINCT FROM city.id
                    OR (to_jsonb(f) - 'collectivite_id') IS DISTINCT FROM (a.row_data - 'collectivite_id')
                )
            ) THEN RAISE EXCEPTION 'Transfert des fiches incomplet ou contenu modifié'; END IF;
        ELSE
            IF pg_temp.arrondissements_check_children(target_ids, false, rule.relation) THEN
                RAISE EXCEPTION 'Références restantes avant suppression de %', rule.relation;
            END IF;
            EXECUTE format(
                'WITH removed AS (DELETE FROM %s t WHERE %s RETURNING t.*),
                 missing AS (
                    SELECT to_jsonb(removed) AS row_data FROM removed
                    EXCEPT ALL
                    SELECT row_data FROM %s WHERE run_id = $2 AND source_table = $3 AND phase = ''before''
                 ), archived AS (
                    INSERT INTO %s (run_id, source_table, operation, phase, row_data)
                    SELECT $2, $3, ''archive'', ''removed'', row_data FROM missing RETURNING row_data
                 ) SELECT (SELECT count(*) FROM removed),
                    (SELECT count(*) FROM missing) = (SELECT count(*) FROM archived)',
                rule.relation, rule.predicate, archive_table, archive_table
            ) INTO changed_count, archive_complete USING target_ids, cleanup_id, qualified_name;
            IF NOT archive_complete THEN RAISE EXCEPTION 'Archive de suppression incomplète de %', rule.relation; END IF;
        END IF;
        IF changed_count <> reference_count THEN
            RAISE EXCEPTION 'Traitement incomplet de % : %/% lignes', rule.relation, changed_count, reference_count;
        END IF;
        EXECUTE format('SELECT count(*) FROM %s t WHERE %s', rule.relation, rule.predicate)
            INTO changed_count USING target_ids;
        IF changed_count <> 0 THEN RAISE EXCEPTION 'Lignes restantes après traitement de %', rule.relation; END IF;
        IF rule.relation = 'public.collectivite'::regclass THEN deleted_count := reference_count; END IF;
    END LOOP;
    -- Inclure les références sans FK créées par les triggers, même pendant le
    -- dernier DELETE. Tout le lot, y compris l'archive, est annulé en cas d'écart.
    FOR dependency IN SELECT * FROM pg_temp.arrondissements_references()
    LOOP
        EXECUTE format('SELECT count(*) FROM %s t WHERE t.%I = ANY($1::%s[])',
            dependency.relation, dependency.column_name, dependency.column_type)
            INTO changed_count USING target_ids;
        IF changed_count > 0 THEN
            RAISE EXCEPTION 'Références restantes après traitement : %.%', dependency.relation, dependency.column_name;
        END IF;
    END LOOP;
    IF deleted_count <> cardinality(target_ids) THEN
        RAISE EXCEPTION 'Suppression incomplète : %/% espaces', deleted_count, cardinality(target_ids);
    END IF;
    RAISE NOTICE 'Archive administrative : % | run_id %', archive_table, cleanup_id;
    RETURN deleted_count;
END;
$$;
