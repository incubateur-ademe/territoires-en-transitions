-- Revert tet:plan_action/drop_fiche_action_volet_ges_created_by from pg

BEGIN;

alter table public.fiche_action_volet_ges
  add column created_by uuid default auth.uid()
    constraint fiche_action_volet_ges_created_by_fkey references auth.users (id);

COMMIT;
