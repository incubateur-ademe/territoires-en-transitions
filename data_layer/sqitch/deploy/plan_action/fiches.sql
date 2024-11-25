-- Deploy tet:plan_action/fiches to pg

BEGIN;

ALTER TABLE fiche_action_libre_tag
DROP CONSTRAINT fiche_action_libre_tag_fiche_id_fkey;

ALTER TABLE fiche_action_libre_tag
ADD CONSTRAINT fiche_action_libre_tag_fiche_id_fkey
FOREIGN KEY (fiche_id)
REFERENCES fiche_action(id)
ON DELETE CASCADE;


COMMIT;
