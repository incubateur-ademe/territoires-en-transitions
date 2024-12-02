-- Revert tet:plan_action/fiche_note from pg

BEGIN;

drop table public.fiche_action_note;

COMMIT;
