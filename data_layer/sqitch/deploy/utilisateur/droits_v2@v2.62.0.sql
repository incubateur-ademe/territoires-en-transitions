-- Deploy tet:utilisateur/droits_v2 to pg
-- requires: utilisateur/niveaux_acces

BEGIN;

create or replace function est_verifie() returns boolean
    security definer
    language sql
    stable
begin
    atomic
    select utilisateur_verifie.verifie
    from utilisateur_verifie
    where utilisateur_verifie.user_id = auth.uid();
end;

create or replace function have_edition_acces(id integer) returns boolean
    security definer
    language sql
    stable
begin
    atomic
    select exists (select
                   from private_utilisateur_droit
                   where private_utilisateur_droit.collectivite_id = have_edition_acces.id
                     and private_utilisateur_droit.user_id = auth.uid()
                     and (niveau_acces = 'edition' or niveau_acces = 'admin')
                     and active);
end;

create or replace function
    can_read_acces_restreint(collectivite_id integer) returns boolean
    security definer
    language sql
    stable
begin
    atomic
    select case
               when (select access_restreint
                     from collectivite
                     where id = can_read_acces_restreint.collectivite_id
                     limit 1)
                   then have_lecture_acces(can_read_acces_restreint.collectivite_id)
                   or est_support()
                   or private.est_auditeur(can_read_acces_restreint.collectivite_id)
               else est_verifie() end;
end;

create or replace function
    peut_modifier_la_fiche(fiche_id integer) returns boolean
    security definer
    language sql
    stable
begin
    atomic
    select have_edition_acces(fa.collectivite_id)
    from fiche_action fa
    where fa.id = fiche_id;
end;

COMMIT;
