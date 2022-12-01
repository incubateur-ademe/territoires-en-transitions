-- Verify tet:referentiel/action_statut_history on pg

BEGIN;

select has_function_privilege('historique.action_statut_at(int, timestamp with time zone)', 'execute');

ROLLBACK;
