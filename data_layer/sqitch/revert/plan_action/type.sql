-- Revert tet:plan_action/type from pg

BEGIN;

drop function plan_action_type(axe);

COMMIT;
