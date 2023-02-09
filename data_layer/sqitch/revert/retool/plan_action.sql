-- Revert tet:retool/plan_action from pg

BEGIN;

drop view retool_plan_action_usage;
drop view retool_plan_action_hebdo;

COMMIT;
