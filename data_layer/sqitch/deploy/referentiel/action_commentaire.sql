-- Deploy tet:referentiel/action_commentaire to pg
-- requires: referentiel/contenu

BEGIN;

create trigger set_modified_by_before_action_commentaire_update before
update
    on
    public.action_commentaire for each row execute function utilisateur.update_modified_by();

COMMIT;
