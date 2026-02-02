-- Verify tet:creation_dune_table_instance_de_gouvernance on pg

BEGIN;

SELECT id, nom, collectivite_id, created_by, created_at FROM instance_de_gouvernance_tag WHERE false;
SELECT fiche_action_id, instance_de_gouvernance_tag_id, created_by, created_at FROM fiche_action_instance_de_gouvernance_tag     WHERE false;
ROLLBACK;
