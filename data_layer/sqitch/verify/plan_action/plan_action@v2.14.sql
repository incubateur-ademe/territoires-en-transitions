-- Verify tet:plan_action on pg

BEGIN;

select has_function_privilege('peut_lire_la_fiche(integer)', 'execute');

ROLLBACK;
