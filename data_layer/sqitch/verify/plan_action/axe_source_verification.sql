-- Verify tet:plan_action/axe_source_verification on pg

BEGIN;

DO $$
DECLARE
    fk_verified_by text;
BEGIN
    ASSERT (
        SELECT COUNT(*) = 3
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'axe'
          AND column_name IN ('source', 'verified_at', 'verified_by')
          AND is_nullable = 'YES'
    ), 'La table axe doit porter source, verified_at et verified_by, NULLABLE';

    ASSERT (
        SELECT pg_get_constraintdef(oid) LIKE '%import_ia%'
        FROM pg_constraint
        WHERE conname = 'axe_source_check'
    ), 'La contrainte axe_source_check doit restreindre source à import_ia';

    SELECT rc.delete_rule INTO fk_verified_by
    FROM information_schema.table_constraints tc
    JOIN information_schema.referential_constraints rc
        USING (constraint_schema, constraint_name)
    JOIN information_schema.key_column_usage kcu
        USING (constraint_schema, constraint_name)
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'axe'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'verified_by'
    LIMIT 1;

    ASSERT fk_verified_by = 'SET NULL',
        'La FK verified_by doit avoir delete_rule = SET NULL';
END $$;

ROLLBACK;
