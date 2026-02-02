-- Revert tet:creation_dune_table_instance_de_gouvernance from pg

BEGIN;

DROP TABLE fiche_action_instance_de_gouvernance;
DROP TABLE instance_de_gouvernance;

COMMIT;
