-- Deploy tet:plan_action/budget to pg

BEGIN;

update fiche_action_budget
set budget_previsionnel = round(budget_previsionnel),
    budget_reel = round(budget_reel);

alter table fiche_action_budget
  alter column budget_previsionnel type numeric(12),
  alter column budget_reel type numeric(12);


COMMIT;
