\set ON_ERROR_STOP on

BEGIN READ ONLY;

-- Operator-friendly checks before the protected contract deployment. These
-- checks deliberately do not claim to close races: the contract migration
-- repeats its data audit while holding the required locks.
DO $preflight$
DECLARE
    conflit_formule record;
BEGIN
    IF to_regclass('public.indicateur_periodicite') IS NULL
       OR to_regclass('migration.indicateur_valeur_periodicite_audit') IS NULL
       OR to_regprocedure(
           'public.indicateur_date_debut_periode(text,date)'
       ) IS NULL
       OR to_regprocedure(
           'private.extraire_dependances_formule_indicateur(text)'
       ) IS NULL THEN
        RAISE EXCEPTION USING
            ERRCODE = '55000',
            MESSAGE = 'La phase expand de la périodicité n''est pas complètement déployée';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.indicateur_definition definition
        LEFT JOIN public.indicateur_periodicite periodicite
          ON periodicite.code = definition.periodicite
        WHERE definition.periodicite IS NULL
           OR periodicite.code IS NULL
    ) THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = 'Toutes les définitions doivent avoir une périodicité connue avant le contract';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM migration.indicateur_valeur_periodicite_audit
        WHERE statut = 'conflit'
    ) THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = 'Les conflits de migration de périodicité doivent être remédiés avant le contract';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.indicateur_valeur valeur
        JOIN public.indicateur_definition definition
          ON definition.id = valeur.indicateur_id
        WHERE valeur.date_valeur <> public.indicateur_date_debut_periode(
            valeur.periodicite,
            valeur.date_valeur
        )
    ) THEN
        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = 'Toutes les valeurs doivent utiliser une date canonique avant le contract';
    END IF;

    SELECT cible.id AS cible_id,
           cible.periodicite AS periodicite_cible,
           dependance.source_identifiant,
           source.id AS source_id,
           source.periodicite AS periodicite_source
    INTO conflit_formule
    FROM public.indicateur_definition cible
    CROSS JOIN LATERAL private.extraire_dependances_formule_indicateur(
        cible.valeur_calcule
    ) AS dependance
    LEFT JOIN public.indicateur_definition source
      ON source.identifiant_referentiel = dependance.source_identifiant
    WHERE source.id IS NULL
       OR source.periodicite IS DISTINCT FROM cible.periodicite
    ORDER BY cible.id, dependance.source_identifiant
    LIMIT 1;

    IF FOUND THEN
        IF conflit_formule.source_id IS NULL THEN
            RAISE EXCEPTION USING
                ERRCODE = '23503',
                MESSAGE = format(
                    'La formule de l''indicateur %s référence la définition inconnue %s',
                    conflit_formule.cible_id,
                    conflit_formule.source_identifiant
                );
        END IF;

        RAISE EXCEPTION USING
            ERRCODE = '23514',
            MESSAGE = format(
                'La formule de l''indicateur %s (%s) ne peut pas dépendre de %s (%s)',
                conflit_formule.cible_id,
                conflit_formule.periodicite_cible,
                conflit_formule.source_identifiant,
                conflit_formule.periodicite_source
            );
    END IF;
END
$preflight$;

ROLLBACK;
