-- Revert tet:utilisateur/dcp_add_rights_search_path from pg

BEGIN;

create or replace function public.after_insert_dcp_add_rights() returns trigger
as
$$
declare
    invitation boolean;
begin
    insert into utilisateur_support (user_id) values(new.user_id);

    select count(*)!=0
    from private_utilisateur_droit pud
    where pud.user_id = new.user_id
      and pud.invitation_id is not null
    into invitation;

    insert into utilisateur_verifie (user_id, verifie) values(new.user_id, invitation)
    on conflict (user_id) do update set verifie = invitation;

    return new;
end;
$$ language plpgsql security definer;
comment on function public.after_insert_dcp_add_rights() is 'Ajoute le droit support et verifie';

COMMIT;
