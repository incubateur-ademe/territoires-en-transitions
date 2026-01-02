-- Revert tet:plan_action/axe_description from pg

BEGIN;

alter table axe
  drop column description;

COMMIT;
