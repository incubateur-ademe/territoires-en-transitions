-- Verify tet:demarche/plan_action_exclusif on pg

BEGIN;

DO $$
DECLARE
    def text;
BEGIN
    SELECT indexdef INTO def
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'demarche_plan_action_active_unique';

    ASSERT def IS NOT NULL,
        'L''index demarche_plan_action_active_unique doit exister';
    ASSERT def LIKE 'CREATE UNIQUE INDEX%',
        'L''index doit être unique';
    ASSERT def LIKE '%en_elaboration%' AND def LIKE '%transmis_pour_avis%',
        'L''index doit être partiel sur les statuts actifs';
END $$;

ROLLBACK;
