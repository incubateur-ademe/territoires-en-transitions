-- Deploy tet:utilisateur/dcp_sync to pg

BEGIN;

create function
    utilisateur.sync_dcp()
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
