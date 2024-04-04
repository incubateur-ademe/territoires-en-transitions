-- Revert tet:panier_action_impact/plan_action from pg

BEGIN;

drop function plan_from_panier(int, uuid);

COMMIT;
