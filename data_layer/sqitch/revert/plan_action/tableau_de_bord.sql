-- Revert tet:plan_action/tableau_de_bord from pg

BEGIN;

drop function plan_action_tableau_de_bord(collectivite_id integer, plan_id integer, sans_plan boolean);
drop table typage.plan_action_tableau_de_bord;
drop table typage.graphique_tranche;

COMMIT;
