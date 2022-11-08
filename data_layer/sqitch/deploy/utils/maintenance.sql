-- Deploy tet:utils/maintenance to pg

BEGIN;

alter publication supabase_realtime add table maintenance;

COMMIT;
