-- Fonction limitée à la session psql ; aucune fonction applicative n'est installée.
-- TET-6518 : supprimer uniquement les espaces sans données à conserver.
CREATE OR REPLACE FUNCTION pg_temp.delete_arrondissements_paris_marseille(
    apply boolean DEFAULT false
) RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    target_ids integer[];
    target record;
    dependency record;
    reference_count record;
    blocked boolean := false;
    city_count integer;
    deleted_count integer;
BEGIN
    IF apply IS NULL THEN
        RAISE EXCEPTION 'Le mode apply doit être true ou false';
    END IF;

    -- Ne jamais produire un inventaire incomplet à cause des politiques RLS.
    PERFORM set_config('row_security', 'off', true);

    IF apply THEN
        -- Maintenir l'inventaire stable jusqu'au DELETE. L'opérateur doit fermer
        -- les écritures le temps de cette transaction (voir le README).
        LOCK TABLE public.collectivite, public.collectivite_bucket
            IN SHARE ROW EXCLUSIVE MODE;
        LOCK TABLE storage.objects IN SHARE MODE;
    END IF;

    SELECT coalesce(array_agg(id ORDER BY id), ARRAY[]::integer[])
    INTO target_ids
    FROM public.collectivite
    WHERE type = 'commune'
      AND commune_code::text IN (
          SELECT code::text FROM generate_series(13201, 13216) AS code
          UNION ALL
          SELECT code::text FROM generate_series(75101, 75120) AS code
      );

    FOR target IN
        SELECT id, nom, commune_code FROM public.collectivite
        WHERE id = ANY(target_ids) ORDER BY commune_code
    LOOP
        RAISE NOTICE 'Espace ciblé : #% | % | %',
            target.id, target.commune_code, target.nom;
    END LOOP;
    RAISE NOTICE '% espace(s) ciblé(s) sur les 36 codes autorisés', cardinality(target_ids);

    IF cardinality(target_ids) = 0 THEN
        RETURN 0;
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.collectivite WHERE id = ANY(target_ids)
        GROUP BY commune_code HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Plusieurs espaces portent le même code arrondissement : arbitrage requis';
    END IF;

    SELECT count(DISTINCT commune_code) INTO city_count
    FROM public.collectivite
    WHERE type = 'commune' AND commune_code::text IN ('13055', '75056');
    IF city_count <> 2 THEN
        RAISE NOTICE 'BLOCAGE : vérifier la présence des espaces Ville de Marseille (13055) et Paris (75056)';
        blocked := true;
    END IF;

    -- Inclure les FK (CASCADE et SET NULL compris), même avec une colonne
    -- différente de collectivite_id ou une clé composite. Inclure également
    -- les historiques et autres tables avec collectivite_id sans FK.
    -- Seul le lien vers un bucket vide est supprimable automatiquement.
    FOR dependency IN
        WITH columns AS (
            SELECT constraint_row.conrelid AS relation_id, key.attnum
            FROM pg_catalog.pg_constraint AS constraint_row
            CROSS JOIN LATERAL unnest(constraint_row.conkey, constraint_row.confkey)
                AS key(attnum, referenced_attnum)
            JOIN pg_catalog.pg_attribute AS referenced_column
              ON referenced_column.attrelid = constraint_row.confrelid
             AND referenced_column.attnum = key.referenced_attnum
            WHERE constraint_row.contype = 'f'
              AND constraint_row.confrelid = 'public.collectivite'::regclass
              AND referenced_column.attname = 'id'
            UNION
            SELECT attrelid, attnum FROM pg_catalog.pg_attribute
            WHERE attname = 'collectivite_id' AND NOT attisdropped
        )
        SELECT DISTINCT namespace.nspname AS schema_name,
               relation.relname AS table_name, attribute.attname AS column_name,
               pg_catalog.format_type(attribute.atttypid, NULL) AS column_type
        FROM columns
        JOIN pg_catalog.pg_class AS relation ON relation.oid = columns.relation_id
        JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = relation.relnamespace
        JOIN pg_catalog.pg_attribute AS attribute
          ON attribute.attrelid = columns.relation_id AND attribute.attnum = columns.attnum
        WHERE relation.relkind IN ('r', 'p')
          AND NOT relation.relispartition
          AND namespace.nspname !~ '^pg_'
          AND namespace.nspname <> 'information_schema'
          AND NOT (columns.relation_id = 'public.collectivite_bucket'::regclass
                   AND attribute.attname = 'collectivite_id')
        ORDER BY schema_name, table_name, column_name
    LOOP
        IF apply THEN
            EXECUTE format('LOCK TABLE %I.%I IN SHARE MODE',
                dependency.schema_name, dependency.table_name);
        END IF;

        -- L'import CSV stocke collectivite_id en text. Convertir les identifiants
        -- ciblés au type de la colonne, sans convertir ses valeurs ni perdre
        -- l'usage des index sur les références numériques.
        FOR reference_count IN EXECUTE format(
            'SELECT %1$I::text AS collectivite_id, count(*) AS total FROM %2$I.%3$I
             WHERE %1$I = ANY($1::%4$s[]) GROUP BY %1$I ORDER BY %1$I',
            dependency.column_name, dependency.schema_name, dependency.table_name,
            dependency.column_type
        ) USING target_ids
        LOOP
            RAISE NOTICE 'BLOCAGE : #% | %.%.% | % ligne(s)',
                reference_count.collectivite_id, dependency.schema_name,
                dependency.table_name, dependency.column_name, reference_count.total;
            blocked := true;
        END LOOP;
    END LOOP;

    FOR target IN
        SELECT link.collectivite_id, link.bucket_id, count(object.id) AS object_count
        FROM public.collectivite_bucket AS link
        LEFT JOIN storage.objects AS object ON object.bucket_id = link.bucket_id
        WHERE link.collectivite_id = ANY(target_ids)
        GROUP BY link.collectivite_id, link.bucket_id
        ORDER BY link.collectivite_id, link.bucket_id
    LOOP
        RAISE NOTICE 'Stockage : #% | bucket % | % objet(s)',
            target.collectivite_id, target.bucket_id, target.object_count;
        IF target.object_count > 0 THEN
            blocked := true;
        END IF;
    END LOOP;

    IF NOT apply THEN
        RAISE NOTICE 'Inventaire uniquement : aucune suppression. Blocage détecté : %', blocked;
        RETURN 0;
    END IF;

    IF blocked THEN
        RAISE EXCEPTION 'Suppression refusée : des données ou des espaces Ville nécessitent un arbitrage. Aucune suppression effectuée';
    END IF;

    DELETE FROM public.collectivite_bucket WHERE collectivite_id = ANY(target_ids);
    -- Les buckets vides restent dans storage.buckets : leur éventuelle suppression
    -- passe par l'API Storage, jamais par une suppression SQL des fichiers.
    DELETE FROM public.collectivite WHERE id = ANY(target_ids);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count <> cardinality(target_ids) THEN
        RAISE EXCEPTION 'Suppression incomplète : %/% espaces', deleted_count, cardinality(target_ids);
    END IF;
    RETURN deleted_count;
END;
$$;
