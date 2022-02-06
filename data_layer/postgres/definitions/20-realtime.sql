begin;
-- remove the realtime publication
drop publication if exists supabase_realtime;

-- re-create the publication but don't enable it for any tables
create publication supabase_realtime;
commit;

-- add a tables to the publication
alter publication supabase_realtime add table action_statut;
alter publication supabase_realtime add table action_statut_update_event;
alter publication supabase_realtime add table client_scores;
