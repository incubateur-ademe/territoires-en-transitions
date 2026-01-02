-- Deploy tet:plan_action/axe_description to pg

BEGIN;

alter table axe
  add column description text;

COMMIT;
