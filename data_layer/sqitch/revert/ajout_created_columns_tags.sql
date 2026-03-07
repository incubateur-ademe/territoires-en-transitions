-- Revert tet:ajout_created_columns_tags from pg

BEGIN;

ALTER TABLE financeur_tag
  DROP COLUMN created_by,
  DROP COLUMN created_at;

ALTER TABLE partenaire_tag
  DROP COLUMN created_by,
  DROP COLUMN created_at;

ALTER TABLE service_tag
  DROP COLUMN created_by,
  DROP COLUMN created_at;

ALTER TABLE structure_tag
  DROP COLUMN created_by,
  DROP COLUMN created_at;

ALTER TABLE personne_tag
  DROP COLUMN created_by,
  DROP COLUMN created_at;

COMMIT;

