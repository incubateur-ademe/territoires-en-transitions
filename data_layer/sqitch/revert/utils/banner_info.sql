-- Revert tet:utils/banner_info from pg

BEGIN;

DROP TABLE IF EXISTS public.banner_info CASCADE;

COMMIT;
