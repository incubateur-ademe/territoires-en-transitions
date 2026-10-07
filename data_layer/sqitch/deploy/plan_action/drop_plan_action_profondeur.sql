-- Deploy tet:plan_action/drop_plan_action_profondeur to pg

BEGIN;

drop view if exists plan_action_profondeur;
drop function if exists plan_action_profondeur(integer, integer);

COMMIT;
