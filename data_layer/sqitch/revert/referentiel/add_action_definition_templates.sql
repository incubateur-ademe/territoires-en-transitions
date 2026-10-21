-- Revert tet:referentiel/add_action_definition_templates from pg

BEGIN;

alter table action_definition drop column templates;

COMMIT;
