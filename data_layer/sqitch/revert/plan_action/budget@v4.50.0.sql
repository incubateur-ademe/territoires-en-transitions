-- Revert tet:plan_action/budget from pg

BEGIN;

comment on column fiche_action.budget_previsionnel is null;

drop table fiche_action_budget;

COMMIT;
