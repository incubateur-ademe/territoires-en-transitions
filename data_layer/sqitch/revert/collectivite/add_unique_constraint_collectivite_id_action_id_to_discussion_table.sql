-- Revert tet:collectivite/add_unique_constraint_collectivite_id_action_id_to_discussion_table from pg

BEGIN;

drop index if exists discussion_collectivite_id_action_id_key;

COMMIT;
