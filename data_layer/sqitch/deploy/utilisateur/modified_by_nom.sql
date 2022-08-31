-- Deploy tet:utilisateur/modified_by_nom to pg
-- requires: utilisateur/dcp_display

BEGIN;

create function
    utilisateur.modified_by_nom(user_id uuid)
    returns text
as
$$

declare
    found utilisateur.dcp_display;

begin
    if is_authenticated()
    then
        select *
        from utilisateur.dcp_display dd
        where dd.user_id = modified_by_nom.user_id
        into found;

        return coalesce(found.prenom || ' ' || found.nom, 'Équipe territoires en transitions');
    else
        return null;
    end if;
end

$$ language plpgsql security definer;
comment on function utilisateur.modified_by_nom is
    'Fonction pour afficher le nom de l''utilisateur dans le client.';

COMMIT;
