-- Deploy tet:dcp to pg
-- requires: base

BEGIN;

create or replace function after_insert_dcp_add_rights() returns trigger
as
$$
begin
    insert into utilisateur_support (user_id) values(new.user_id);
    if (
        -- Vérifie s'il existe une invitiation et si oui met en vérifié
        select count(*)=0
        from private_utilisateur_droit pud
        where pud.user_id = new.user_id
          and invitation_id is not null
    ) then
        insert into utilisateur_verifie (user_id) values(new.user_id);
    else
        insert into utilisateur_verifie (user_id, verifie) values(new.user_id, true);
    end if;
    return new;
end;
$$ language plpgsql security definer;
comment on function after_insert_dcp_add_rights() is 'Ajoute le droit support et verifie';

COMMIT;
