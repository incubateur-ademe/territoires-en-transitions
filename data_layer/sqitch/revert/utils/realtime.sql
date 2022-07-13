-- Revert tet:realtime from pg

BEGIN;

drop publication supabase_realtime;

COMMIT;
