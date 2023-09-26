-- Verify tet:evaluation/thematique_completude on pg

BEGIN;

select has_function_privilege('private.reponse_count_by_thematique(integer, varchar)', 'execute');

ROLLBACK;
