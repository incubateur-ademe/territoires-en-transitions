-- Deploy tet:indicateur/import_emt_valeur to pg
-- requires: indicateur/periodicite

BEGIN;

-- Frontière transactionnelle de l'ancien import EMT. Le classeur ne porte
-- que des années : cette fonction refuse donc toute autre cadence et garde le
-- contrôle des définitions, des verrous de période et de toutes les écritures
-- du classeur dans une transaction PostgreSQL unique.
CREATE FUNCTION public.import_indicateur_emt_valeurs(
    collectivite_id_a_ecrire integer,
    valeurs_a_ecrire jsonb
)
    RETURNS integer
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
AS $$
DECLARE
    valeur_a_ecrire record;
    periodicite_effective text;
    valeur_existante public.indicateur_valeur%ROWTYPE;
    valeurs_ecrites integer := 0;
BEGIN
    IF collectivite_id_a_ecrire IS NULL OR collectivite_id_a_ecrire < 1 THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = format(
                'Collectivité EMT invalide : %s',
                COALESCE(collectivite_id_a_ecrire::text, 'NULL')
            );
    END IF;

    IF valeurs_a_ecrire IS NULL
       OR jsonb_typeof(valeurs_a_ecrire) IS DISTINCT FROM 'array'
    THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = 'Les valeurs EMT doivent former un tableau JSON';
    END IF;

    -- Même ordre que les writers applicatifs : graphe, définition, période.
    -- La prise de ce verrou avant tout traitement stabilise les cadences pour
    -- la totalité du lot.
    PERFORM pg_advisory_xact_lock_shared(
        hashtextextended('indicateur-calculation-graph', 0)
    );

    PERFORM 1
    FROM public.collectivite
    WHERE id = collectivite_id_a_ecrire
    FOR KEY SHARE;
    IF NOT FOUND THEN
        RAISE EXCEPTION USING
            ERRCODE = '23503',
            MESSAGE = format(
                'Collectivité EMT introuvable : %s',
                collectivite_id_a_ecrire
            );
    END IF;

    -- Valide et verrouille d'abord toutes les définitions, dans l'ordre de
    -- leur identifiant. Aucun verrou de période ni aucune écriture n'est pris
    -- tant que le lot complet n'est pas valide.
    FOR valeur_a_ecrire IN
        SELECT valeur.*, element.ordinality
        FROM jsonb_array_elements(valeurs_a_ecrire)
            WITH ORDINALITY AS element(payload, ordinality)
        CROSS JOIN LATERAL jsonb_to_record(element.payload) AS valeur(
            indicateur_id integer,
            periodicite text,
            date_debut date,
            resultat double precision,
            commentaire text
        )
        ORDER BY valeur.indicateur_id, valeur.date_debut, element.ordinality
    LOOP
        IF valeur_a_ecrire.periodicite IS DISTINCT FROM 'annuelle' THEN
            RAISE EXCEPTION USING
                ERRCODE = '23514',
                MESSAGE = format(
                    'L''import EMT exige une périodicité annuelle, reçu : %s',
                    COALESCE(valeur_a_ecrire.periodicite, 'NULL')
                );
        END IF;

        SELECT definition.periodicite
        INTO periodicite_effective
        FROM public.indicateur_definition definition
        WHERE definition.id = valeur_a_ecrire.indicateur_id
          AND definition.collectivite_id IS NULL
          AND definition.groupement_id IS NULL
          AND definition.identifiant_referentiel IS NOT NULL
        FOR SHARE;

        IF NOT FOUND THEN
            RAISE EXCEPTION USING
                ERRCODE = '23503',
                MESSAGE = format(
                    'Définition EMT prédéfinie introuvable : %s',
                    COALESCE(valeur_a_ecrire.indicateur_id::text, 'NULL')
                );
        END IF;

        IF periodicite_effective IS DISTINCT FROM valeur_a_ecrire.periodicite THEN
            RAISE EXCEPTION USING
                ERRCODE = '23514',
                MESSAGE = format(
                    'La périodicité de l''indicateur %s a changé : attendu %s, trouvé %s',
                    valeur_a_ecrire.indicateur_id,
                    valeur_a_ecrire.periodicite,
                    periodicite_effective
                );
        END IF;

        IF valeur_a_ecrire.date_debut IS NULL
           OR valeur_a_ecrire.date_debut IS DISTINCT FROM
              public.indicateur_date_debut_periode(
                  periodicite_effective,
                  valeur_a_ecrire.date_debut
              )
        THEN
            RAISE EXCEPTION USING
                ERRCODE = '23514',
                MESSAGE = format(
                    'Date EMT non canonique pour l''indicateur %s : %s',
                    valeur_a_ecrire.indicateur_id,
                    COALESCE(valeur_a_ecrire.date_debut::text, 'NULL')
                );
        END IF;

    END LOOP;

    -- La clé de concurrence des valeurs ne contient pas l'indicateur. Trier
    -- le lot par indicateur ne suffit donc pas : deux lots peuvent parcourir
    -- les mêmes dates dans un ordre opposé. Les clés distinctes sont prises
    -- ici dans le même ordre lexicographique global que le repository NestJS.
    PERFORM pg_advisory_xact_lock(
        hashtextextended(verrou.lock_key, 0)
    )
    FROM (
        SELECT DISTINCT format(
            'indicateur-valeur:%s:%s',
            collectivite_id_a_ecrire,
            to_char(valeur.date_debut, 'YYYY-MM-DD')
        ) AS lock_key
        FROM jsonb_array_elements(valeurs_a_ecrire) AS element(payload)
        CROSS JOIN LATERAL jsonb_to_record(element.payload) AS valeur(
            date_debut date
        )
        ORDER BY lock_key
    ) AS verrou;

    FOR valeur_a_ecrire IN
        SELECT valeur.*, element.ordinality
        FROM jsonb_array_elements(valeurs_a_ecrire)
            WITH ORDINALITY AS element(payload, ordinality)
        CROSS JOIN LATERAL jsonb_to_record(element.payload) AS valeur(
            indicateur_id integer,
            periodicite text,
            date_debut date,
            resultat double precision,
            commentaire text
        )
        ORDER BY valeur.indicateur_id, valeur.date_debut, element.ordinality
    LOOP

        SELECT valeur.*
        INTO valeur_existante
        FROM public.indicateur_valeur valeur
        WHERE valeur.indicateur_id = valeur_a_ecrire.indicateur_id
          AND valeur.collectivite_id = collectivite_id_a_ecrire
          AND valeur.date_valeur = valeur_a_ecrire.date_debut
          AND valeur.periodicite = 'annuelle'
          AND valeur.metadonnee_id IS NULL
        FOR UPDATE;

        -- Le comportement historique ne remplace jamais un résultat manuel
        -- déjà présent. Il ajoute seulement le commentaire du classeur.
        IF FOUND THEN
            IF NULLIF(valeur_a_ecrire.commentaire, '') IS NOT NULL THEN
                UPDATE public.indicateur_valeur
                SET resultat_commentaire = CASE
                        WHEN NULLIF(
                            valeur_existante.resultat_commentaire,
                            ''
                        ) IS NULL
                            THEN valeur_a_ecrire.commentaire
                        ELSE valeur_a_ecrire.commentaire || E'\n---\n'
                             || valeur_existante.resultat_commentaire
                    END
                WHERE id = valeur_existante.id;
                valeurs_ecrites := valeurs_ecrites + 1;
            END IF;
            CONTINUE;
        END IF;

        IF valeur_a_ecrire.resultat IS NULL
           AND NULLIF(valeur_a_ecrire.commentaire, '') IS NULL
        THEN
            CONTINUE;
        END IF;

        INSERT INTO public.indicateur_valeur (
            indicateur_id,
            collectivite_id,
            date_valeur,
            metadonnee_id,
            resultat,
            resultat_commentaire,
            calcul_auto,
            calcul_auto_identifiants_manquants
        ) VALUES (
            valeur_a_ecrire.indicateur_id,
            collectivite_id_a_ecrire,
            valeur_a_ecrire.date_debut,
            NULL,
            valeur_a_ecrire.resultat,
            NULLIF(valeur_a_ecrire.commentaire, ''),
            false,
            NULL
        );
        valeurs_ecrites := valeurs_ecrites + 1;
    END LOOP;

    RETURN valeurs_ecrites;
END;
$$;

COMMENT ON FUNCTION public.import_indicateur_emt_valeurs(integer, jsonb) IS
    'Importe atomiquement un lot de valeurs EMT annuelles après verrouillage et revalidation des périodicités.';

REVOKE ALL ON FUNCTION public.import_indicateur_emt_valeurs(integer, jsonb)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.import_indicateur_emt_valeurs(integer, jsonb)
TO service_role;

COMMIT;
