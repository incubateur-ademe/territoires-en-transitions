-- Revert tet:referentiel/add_type_calcul_score from pg

BEGIN;

alter table action_definition
  drop column type_calcul_score;

COMMIT;
