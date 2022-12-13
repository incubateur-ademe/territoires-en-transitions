-- Verify tet:referentiel/action_statut_history on pg

BEGIN;

select has_function_privilege('historique.action_statuts_at(int, referentiel, timestamp with time zone)', 'execute');

ROLLBACK;
