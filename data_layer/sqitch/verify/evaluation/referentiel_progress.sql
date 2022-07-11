-- Verify tet:evaluation/referentiel_progress on pg

BEGIN;

select has_function_privilege('private.referentiel_progress(integer)', 'execute');

ROLLBACK;
