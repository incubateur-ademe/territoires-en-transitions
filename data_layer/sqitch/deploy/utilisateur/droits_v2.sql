-- Deploy tet:utilisateur/droits_v2 to pg
-- requires: utilisateur/niveaux_acces

BEGIN;

create or replace function
    have_admin_acces(id integer)
    returns boolean
as
$$
begin
    return auth.role() = 'authenticated'
        and exists(select
                   from private_utilisateur_droit
                   where private_utilisateur_droit.collectivite_id = have_admin_acces.id
                     and private_utilisateur_droit.user_id = auth.uid()
                     and niveau_acces = 'admin'
                     and active);
end
$$ language plpgsql security definer;

create or replace function
    have_edition_acces(id integer)
    returns boolean
as
$$
begin
    return auth.role() = 'authenticated'
        and exists(select
                   from private_utilisateur_droit
                   where private_utilisateur_droit.collectivite_id = have_edition_acces.id
                     and private_utilisateur_droit.user_id = auth.uid()
                     and (niveau_acces = 'edition' or niveau_acces = 'admin')
                     and active);
end
$$ language plpgsql security definer;

create or replace function
    have_lecture_acces(id integer)
    returns boolean
as
$$
begin
    return auth.role() = 'authenticated'
        and exists(select
                   from private_utilisateur_droit
                   where private_utilisateur_droit.collectivite_id = have_lecture_acces.id
                     and private_utilisateur_droit.user_id = auth.uid()
                     and active);
end
$$ language plpgsql security definer;

COMMIT;
