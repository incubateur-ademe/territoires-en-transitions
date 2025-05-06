-- Revert tet:auth/user_api_keys from pg

BEGIN;

DROP TABLE IF EXISTS public.user_api_key;

COMMIT;
