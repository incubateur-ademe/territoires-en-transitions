-- Revert tet:utilisateur/dcp_sync_insert_update from pg

BEGIN;

-- Supprime la fonction (CASCADE supprime les triggers sans nécessiter d'être owner de auth.users)
drop function if exists utilisateur.sync_dcp() cascade;

-- Restaure la fonction originale (UPDATE uniquement)
create or replace function utilisateur.sync_dcp()
    returns trigger
as
$$
begin
    update public.dcp
    set email = new.email
    where user_id = new.id;
    return new;
end;
$$ language plpgsql security definer;

comment on function utilisateur.sync_dcp is
    'Mets à jour les DCP lorsque l''email change.';

create trigger before_user_update
    after update
    on auth.users
    for each row
execute procedure utilisateur.sync_dcp();

COMMIT;
