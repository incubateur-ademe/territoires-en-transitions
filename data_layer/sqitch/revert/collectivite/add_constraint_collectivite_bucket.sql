-- Revert tet:collectivite/add_constraint_collectivite_bucket from pg

BEGIN;

ALTER TABLE public.collectivite_bucket
    DROP CONSTRAINT IF EXISTS collectivite_bucket_collectivite_id_key;

COMMIT;
