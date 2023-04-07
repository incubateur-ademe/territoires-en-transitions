-- Verify tet:evaluation/reponse_history on pg

BEGIN;

select has_function_privilege('historique.reponses_at(int, timestamp with time zone)', 'execute');

ROLLBACK;
