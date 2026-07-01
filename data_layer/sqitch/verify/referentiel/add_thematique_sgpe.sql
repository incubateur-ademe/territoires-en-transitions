-- Verify tet:referentiel/add_thematique_sgpe on pg

BEGIN;

select thematique_sgpe from action_definition where false;

ROLLBACK;
