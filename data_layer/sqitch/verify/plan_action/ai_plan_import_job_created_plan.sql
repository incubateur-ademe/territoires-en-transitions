-- Verify tet:plan_action/ai_plan_import_job_created_plan on pg

BEGIN;

DO $$
DECLARE
    fk_created text;
BEGIN
    ASSERT (
        SELECT COUNT(*) = 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'ai_plan_import_job'
          AND column_name = 'created_plan_id'
          AND data_type = 'integer'
          AND is_nullable = 'YES'
    ), 'La colonne created_plan_id doit exister en integer NULLABLE';

    SELECT rc.delete_rule INTO fk_created
    FROM information_schema.table_constraints tc
    JOIN information_schema.referential_constraints rc
        USING (constraint_schema, constraint_name)
    JOIN information_schema.key_column_usage kcu
        USING (constraint_schema, constraint_name)
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'ai_plan_import_job'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'created_plan_id'
    LIMIT 1;

    ASSERT fk_created = 'SET NULL',
        'La FK created_plan_id doit avoir delete_rule = SET NULL';
END $$;

ROLLBACK;
