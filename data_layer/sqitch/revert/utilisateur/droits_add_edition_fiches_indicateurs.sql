-- Revert tet:utilisateur/droits_add_edition_fiches_indicateurs from pg

BEGIN;

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

COMMIT;
