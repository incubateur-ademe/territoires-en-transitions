-- Verify tet:realtime on pg

BEGIN;

alter publication supabase_realtime owner to CURRENT_USER;

ROLLBACK;
