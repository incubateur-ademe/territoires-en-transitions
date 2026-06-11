-- Verify tet:plan_action/ai_plan_import_job_confirm on pg

BEGIN;

DO $$
DECLARE
    fk_confirmed     text;
    index_predicate  text;
BEGIN
    ASSERT (
        SELECT COUNT(*) = 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'ai_plan_import_job'
          AND column_name = 'confirmed_plan_id'
          AND data_type = 'integer'
          AND is_nullable = 'YES'
    ), 'La colonne confirmed_plan_id doit exister en integer NULLABLE';

    SELECT rc.delete_rule INTO fk_confirmed
    FROM information_schema.table_constraints tc
    JOIN information_schema.referential_constraints rc
        USING (constraint_schema, constraint_name)
    JOIN information_schema.key_column_usage kcu
        USING (constraint_schema, constraint_name)
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'ai_plan_import_job'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'confirmed_plan_id'
    LIMIT 1;

    ASSERT fk_confirmed = 'SET NULL',
        'La FK confirmed_plan_id doit avoir delete_rule = SET NULL';

    SELECT pg_get_expr(i.indpred, i.indrelid) INTO index_predicate
    FROM pg_index i
    JOIN pg_class c ON c.oid = i.indexrelid
    WHERE c.relname = 'ai_plan_import_job_confirmed_plan_id_unique';

    ASSERT index_predicate IS NOT NULL,
        'L''index unique partiel ai_plan_import_job_confirmed_plan_id_unique doit exister';
    ASSERT (
        SELECT i.indisunique
        FROM pg_index i
        JOIN pg_class c ON c.oid = i.indexrelid
        WHERE c.relname = 'ai_plan_import_job_confirmed_plan_id_unique'
    ), 'L''index ai_plan_import_job_confirmed_plan_id_unique doit être UNIQUE';
END $$;

ROLLBACK;
