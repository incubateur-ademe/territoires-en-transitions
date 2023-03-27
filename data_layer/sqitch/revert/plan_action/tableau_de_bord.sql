-- Revert tet:plan_action/tableau_de_bord from pg

BEGIN;

drop function plan_action_tableau_de_bord(collectivite_id integer, plan_id integer, sans_plan boolean);
drop type plan_action_tableau_de_bord;
drop type graphique_tranche;

COMMIT;
