-- Deploy tet:referentiel/action_commentaire to pg
-- requires: referentiel/contenu

BEGIN;

drop trigger set_modified_by_before_action_commentaire_update
  on public.action_commentaire;

COMMIT;
