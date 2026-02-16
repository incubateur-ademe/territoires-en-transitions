-- Deploy tet:utilisateur/dcp_sync_insert_update to pg
-- Étend sync_dcp pour créer/mettre à jour dcp depuis auth.users (INSERT et UPDATE)

BEGIN;

-- Supprime l'ancienne fonction (CASCADE supprime le trigger sans nécessiter d'être owner de auth.users)
drop function if exists utilisateur.sync_dcp() cascade;

-- Crée la fonction pour gérer INSERT et UPDATE
create or replace function utilisateur.sync_dcp()
    returns trigger
as
$$
begin
    if (TG_OP = 'INSERT') then
        insert into public.dcp (user_id, email, nom, prenom, telephone)
        values (
            new.id,
            coalesce(new.email, ''),
            coalesce(new.raw_user_meta_data->>'nom', ''),
            coalesce(new.raw_user_meta_data->>'prenom', ''),
            new.phone
        );
    elsif (TG_OP = 'UPDATE') then
        update public.dcp
        set
            email = coalesce(new.email, ''),
            nom = coalesce(new.raw_user_meta_data->>'nom', nom),
            prenom = coalesce(new.raw_user_meta_data->>'prenom', prenom),
            telephone = coalesce(new.phone, telephone)
        where user_id = new.id;
    end if;
    return new;
end;
$$ language plpgsql security definer;

comment on function utilisateur.sync_dcp is
    'Copie les infos de auth.users vers dcp à l''insert et à la mise à jour.';

-- Trigger sur INSERT
create trigger after_user_insert
    after insert
    on auth.users
    for each row
execute procedure utilisateur.sync_dcp();

-- Trigger sur UPDATE
create trigger before_user_update
    after update
    on auth.users
    for each row
execute procedure utilisateur.sync_dcp();

COMMIT;
