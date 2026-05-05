-- Deploy tet:plan_action/drop_plan_action_chemin_view to pg

BEGIN;

drop view if exists plan_action_chemin;

COMMIT;
