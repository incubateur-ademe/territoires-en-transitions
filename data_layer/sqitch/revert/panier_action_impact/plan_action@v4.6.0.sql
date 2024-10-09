-- Revert tet:panier_action_impact/plan_action from pg

BEGIN;

drop function plan_from_panier(int, uuid);
drop table fiche_action_effet_attendu;
drop table action_impact_fiche_action;

COMMIT;
