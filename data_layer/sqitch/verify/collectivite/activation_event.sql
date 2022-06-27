-- Verify tet:collectivite/activation_event on pg

BEGIN;

select id, collectivite_id, created_at
from postgres.public.collectivite_activation_event
where false;

select has_function_privilege('before_collectivite_activation_insert_write_event()', 'execute');

comment on trigger before_collectivite_activation_insert_write_event on private_utilisateur_droit is '';

select 1 / count(*)
from pg_publication_tables
where pubname = 'supabase_realtime'
  and tablename = 'collectivite_activation_event';

ROLLBACK;
