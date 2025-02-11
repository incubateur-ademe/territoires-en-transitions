-- Deploy tet:utils/maintenance to pg

BEGIN;

alter publication supabase_realtime drop table maintenance;

COMMIT;
