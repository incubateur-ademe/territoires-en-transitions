-- Deploy tet:plan_action/budget to pg

BEGIN;

alter table fiche_action_budget
  alter column budget_previsionnel type numeric(14, 2),
  alter column budget_reel type numeric(14, 2);

COMMIT;
