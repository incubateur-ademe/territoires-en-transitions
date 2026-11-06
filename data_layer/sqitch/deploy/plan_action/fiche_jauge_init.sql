-- Deploy tet:plan_action/fiche_jauge_init to pg
-- requires: plan_action/fiche_jauge

BEGIN;

alter table public.fiche_action disable trigger save_history;

update public.fiche_action
set jauge = 100
where parent_id is null
  and statut = 'Réalisé'
  and jauge <> 100;

alter table public.fiche_action enable trigger save_history;

COMMIT;
