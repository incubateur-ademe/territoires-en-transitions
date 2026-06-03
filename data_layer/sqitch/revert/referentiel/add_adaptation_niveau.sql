-- Revert tet:referentiel/add_adaptation_niveau from pg

BEGIN;

alter table action_definition
  drop column adaptation_niveau;

COMMIT;
