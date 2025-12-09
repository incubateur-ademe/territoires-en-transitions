-- Deploy tet:plan_action/remove-default-fiche-title to pg

BEGIN;

alter table public.fiche_action alter column titre
  drop default;

COMMIT;
