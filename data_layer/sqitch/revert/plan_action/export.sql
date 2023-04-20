-- Revert tet:plan_action/export from pg

BEGIN;

drop function plan_action_export;

COMMIT;
