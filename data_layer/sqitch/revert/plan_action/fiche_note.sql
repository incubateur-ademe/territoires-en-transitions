-- Deploy tet:plan_action/fiche_note to pg

BEGIN;

alter table public.fiche_action_note
  drop constraint fiche_action_note_pkey;

alter table public.fiche_action_note
  drop column id;

alter table public.fiche_action_note
  add primary key (fiche_id, date_note);

COMMIT;
