-- Deploy tet:collectivite/add_constraint_collectivite_bucket to pg

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
    ) THEN
        ALTER TABLE public.collectivite_bucket
            ADD CONSTRAINT collectivite_bucket_collectivite_id_key UNIQUE (collectivite_id);
    END IF;
END
$$;

COMMIT;
