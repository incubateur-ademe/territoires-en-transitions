-- Verify tet:referentiel/add_action_definition_templates on pg

BEGIN;

select templates from action_definition where false;

ROLLBACK;
