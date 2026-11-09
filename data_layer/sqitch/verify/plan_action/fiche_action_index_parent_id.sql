-- Verify tet:plan_action/fiche_action_index_parent_id on pg

BEGIN;

select 1 / count(*)
  from pg_indexes
 where schemaname = 'public'
   and tablename = 'fiche_action'
   and indexname = 'fiche_action_parent_id_idx';

ROLLBACK;
