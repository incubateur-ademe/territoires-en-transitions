-- Deploy tet:utils/remove_action_data to pg
-- requires: referentiel/action_statut
-- requires: referentiel/action_commentaire

BEGIN;

create function
    private.remove_action_data(a action_id)
    returns void
as
$$
delete from action_statut
where action_id = a;

delete from action_commentaire
where action_id = a;

$$ language sql;
comment on function private.remove_action_data is
    'Supprime les données rattachées à une action';

COMMIT;
