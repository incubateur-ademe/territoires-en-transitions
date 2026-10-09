-- Verify tet:plan_action/axe_status on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT is_nullable = 'NO' AND column_default LIKE '''active''%'
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'axe'
          AND column_name = 'status'
    ), 'La table axe doit porter status, NOT NULL, active par défaut';

    ASSERT (
        SELECT pg_get_constraintdef(oid) LIKE '%to_verify%'
        FROM pg_constraint
        WHERE conname = 'axe_status_check'
    ), 'La contrainte axe_status_check doit restreindre les statuts';

    ASSERT (
        SELECT COUNT(*) = 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'ai_plan_import_job'
          AND column_name = 'fichier_id'
    ), 'La table ai_plan_import_job doit porter fichier_id';
END $$;

ROLLBACK;
