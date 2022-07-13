-- Deploy tet:realtime to pg

BEGIN;

-- remove the default realtime publication
drop publication if exists supabase_realtime;

-- re-create the publication but don't enable it for any tables
create publication supabase_realtime;

COMMIT;
