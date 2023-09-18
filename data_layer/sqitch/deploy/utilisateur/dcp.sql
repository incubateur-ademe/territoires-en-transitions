-- Deploy tet:dcp to pg
-- requires: base

BEGIN;

create or replace function after_insert_dcp_add_rights() returns trigger
as
$$
declare
    invitation boolean;
begin
    insert into utilisateur_support (user_id) values(new.user_id);


    -- Vérifie s'il existe une invitiation et si oui met en vérifié
    select count(*)!=0
    from private_utilisateur_droit pud
    where pud.user_id = new.user_id
      and invitation_id is not null
    into invitation;

    -- On vérifie si l'enregistrement existe déjà
    -- car l'ordre d'exécution entre l'insert dans dcp et consume_invitation peut varier
    insert into utilisateur_verifie (user_id, verifie) values(new.user_id, invitation)
    on conflict (user_id) do update set verifie = invitation;

    return new;
end;
$$ language plpgsql security definer;
comment on function after_insert_dcp_add_rights() is 'Ajoute le droit support et verifie';

COMMIT;
