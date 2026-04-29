-- Verify tet:historique/fiche_action_indexes on pg

BEGIN;

select 1 / count(*)
  from pg_indexes
 where schemaname = 'historique'
   and indexname = 'fiche_action_fiche_id_modified_at_idx';

select 1 / count(*)
  from pg_indexes
 where schemaname = 'historique'
   and indexname = 'fiche_action_pilote_fiche_historise_id_idx';

ROLLBACK;
