-- Deploy tet:retool/plan_action to pg

BEGIN;

drop view retool_plan_action_premier_usage;
drop materialized view private.retool_plan_action_premier_usage;

COMMIT;
