-- Deploy tet:utilisateur/dcp_add_rights_search_path to pg
-- Qualifie les tables avec public. pour que after_insert_dcp_add_rights
-- fonctionne quand appelé depuis sync_dcp (contexte supabase_auth_admin)

BEGIN;

create or replace function public.after_insert_dcp_add_rights() returns trigger
as
$$
declare
    invitation boolean;
begin
    insert into public.utilisateur_support (user_id) values(new.user_id);

    -- Vérifie s'il existe une invitation et si oui met en vérifié
    select count(*)!=0
    from public.private_utilisateur_droit pud
    where pud.user_id = new.user_id
      and pud.invitation_id is not null
    into invitation;

    -- On vérifie si l'enregistrement existe déjà
    -- car l'ordre d'exécution entre l'insert dans dcp et consume_invitation peut varier
    insert into public.utilisateur_verifie (user_id, verifie) values(new.user_id, invitation)
    on conflict (user_id) do update set verifie = invitation;

    return new;
end;
$$ language plpgsql security definer;
comment on function public.after_insert_dcp_add_rights() is 'Ajoute le droit support et verifie';

COMMIT;
