-- Revert tet:plan_action/plan_dates from pg

BEGIN;

alter table axe
  drop column date_debut,
  drop column date_fin;

COMMIT;
