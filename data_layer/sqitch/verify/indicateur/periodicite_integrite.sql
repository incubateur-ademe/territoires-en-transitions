-- Verify tet:indicateur/periodicite_integrite on pg
BEGIN;
DO $$
BEGIN
    ASSERT NOT EXISTS (
        SELECT FROM (VALUES
            ('public.indicateur_definition'::regclass, 'empecher_changement_periodicite_indicateur'),
            ('public.indicateur_groupe'::regclass, 'verifier_periodicite_groupe_indicateur'),
            ('public.indicateur_valeur'::regclass, 'verifier_periodicite_valeur_indicateur')
        ) AS attendu(relation, nom)
        WHERE NOT EXISTS (
            SELECT FROM pg_trigger
            WHERE tgrelid = attendu.relation AND tgname = attendu.nom
              AND tgenabled = 'O' AND NOT tgisinternal
        )
    ), 'Les règles de cadence des définitions, groupes et valeurs doivent être actives';
END $$;
ROLLBACK;
