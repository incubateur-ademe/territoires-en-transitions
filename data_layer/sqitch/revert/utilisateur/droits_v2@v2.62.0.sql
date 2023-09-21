-- Deploy tet:utilisateur/droits_v2 to pg
-- requires: utilisateur/niveaux_acces

BEGIN;

create or replace function can_read_acces_restreint(collectivite_id integer) returns boolean as
$$
begin
    return (select case
                       when (select access_restreint
                             from collectivite
                             where id = can_read_acces_restreint.collectivite_id
                             limit 1)
                           then have_lecture_acces(can_read_acces_restreint.collectivite_id)
                           or est_support()
                           or private.est_auditeur(collectivite_id)
                       else est_verifie() end);

end;
$$ language plpgsql security definer;

create or replace function est_verifie()
    returns boolean
    security definer
begin
    atomic
    select verifie
    from utilisateur_verifie
    where user_id = auth.uid()
      and is_authenticated();
end;

create or replace function peut_modifier_la_fiche(fiche_id integer) returns boolean as $$
begin
    return have_edition_acces((select fa.collectivite_id from fiche_action fa where fa.id = fiche_id limit 1));
end;
$$language plpgsql;

create or replace function have_edition_acces(id integer) returns boolean
    security definer
    language plpgsql
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
$$;

COMMIT;
