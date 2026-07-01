-- Revert tet:referentiel/add_thematique_sgpe from pg

BEGIN;

alter table action_definition drop column thematique_sgpe;

COMMIT;
