-- Verify tet:plan_action/tableau_de_bord on pg

BEGIN;

select id, value
from typage.graphique_tranche
where false;

select collectivite_id, plan_id, statuts, pilotes, referents, priorites
from typage.plan_action_tableau_de_bord
where false;

select has_function_privilege('plan_action_tableau_de_bord(integer, integer, boolean)', 'execute');

ROLLBACK;
