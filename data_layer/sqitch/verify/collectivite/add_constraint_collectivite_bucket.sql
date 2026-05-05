-- Verify tet:collectivite/add_constraint_collectivite_bucket on pg

BEGIN;

DO
$$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'collectivite_bucket'
          AND constraint_name = 'collectivite_bucket_collectivite_id_key'
          AND constraint_type = 'UNIQUE'
    ) THEN
        RAISE EXCEPTION 'Unique constraint collectivite_bucket_collectivite_id_key does not exist';
    END IF;
END
$$;

ROLLBACK;
