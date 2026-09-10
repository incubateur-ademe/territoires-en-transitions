-- Verify tet:stats/report_indicateur_resultat_periode on pg

BEGIN;

SELECT collectivite_id,
       code_siren_insee,
       nom,
       indicateur_id,
       annee,
       resultat,
       periodicite,
       periode_debut
FROM stats.report_indicateur_resultat
WHERE false;

DO $$
BEGIN
    ASSERT NOT EXISTS (
        SELECT 1
        FROM (VALUES
            ('collectivite_id', 1),
            ('code_siren_insee', 2),
            ('nom', 3),
            ('indicateur_id', 4),
            ('annee', 5),
            ('resultat', 6),
            ('periodicite', 7),
            ('periode_debut', 8)
        ) AS attendue(nom, position)
        LEFT JOIN pg_attribute effective
          ON effective.attrelid = 'stats.report_indicateur_resultat'::regclass
         AND effective.attname = attendue.nom
         AND effective.attnum = attendue.position
         AND NOT effective.attisdropped
        WHERE effective.attname IS NULL
    ), 'Les colonnes historiques doivent garder leur position et les dimensions de période être ajoutées à la fin';

    ASSERT (
        SELECT atttypid = 'text'::regtype
        FROM pg_attribute
        WHERE attrelid = 'stats.report_indicateur_resultat'::regclass
          AND attname = 'periodicite'
          AND NOT attisdropped
    ), 'La périodicité du reporting doit être textuelle';

    ASSERT (
        SELECT atttypid = 'date'::regtype
        FROM pg_attribute
        WHERE attrelid = 'stats.report_indicateur_resultat'::regclass
          AND attname = 'periode_debut'
          AND NOT attisdropped
    ), 'Le début de période du reporting doit être une date';

    ASSERT NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgrelid = 'public.indicateur_definition'::regclass
          AND tgname = 'empecher_periodicite_non_annuelle_pendant_retrait'
          AND NOT tgisinternal
    ), 'Le garde temporaire du downgrade doit disparaître avec le reporting compatible';
END $$;

ROLLBACK;
