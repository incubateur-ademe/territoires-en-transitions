-- Deploy tet:collectivite/add_unique_constraint_collectivite_id_action_id_to_discussion_table to pg

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS discussion_collectivite_id_action_id_key
ON discussion (collectivite_id, action_id);

COMMIT;
