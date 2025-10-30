-- Deploy tet:plan_action/sous_fiche to pg

BEGIN;

alter table fiche_action
  add column parent_id integer references fiche_action(id);

COMMIT;
