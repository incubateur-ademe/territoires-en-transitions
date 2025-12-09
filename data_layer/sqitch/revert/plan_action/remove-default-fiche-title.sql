-- Revert tet:plan_action/remove-default-fiche-title from pg

BEGIN;

alter table public.fiche_action alter column titre
  set default 'Nouvelle fiche'::character;

COMMIT;
