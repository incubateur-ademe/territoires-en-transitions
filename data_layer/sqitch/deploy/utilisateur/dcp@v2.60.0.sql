-- Deploy tet:dcp to pg
-- requires: base

BEGIN;

create table utilisateur_verifie
(
    user_id  uuid references dcp on delete cascade primary key,
    verifie boolean not null default false
);
alter table utilisateur_verifie enable row level security;
create policy allow_read on utilisateur_verifie for update using (is_service_role() or user_id = auth.uid());
create policy allow_update on utilisateur_verifie for update using (is_service_role());



create table utilisateur_support
(
    user_id  uuid references dcp on delete cascade not null primary key,
    support boolean not null default false
);
alter table utilisateur_support enable row level security;
create policy allow_read on utilisateur_support for update using (is_service_role() or user_id = auth.uid());
create policy allow_update on utilisateur_support for update using (is_service_role());

create function est_verifie()
    returns boolean
    security definer
begin
    atomic
    select verifie
    from utilisateur_verifie
    where user_id = auth.uid()
      and is_authenticated();
end;
comment on function est_verifie is 'Vrai si l''utilisateur courant est vérifié';

create function est_support()
    returns boolean
    security definer
begin
    atomic
    select support
    from utilisateur_support
    where user_id = auth.uid()
      and is_authenticated();
end;
comment on function est_support is 'Vrai si l''utilisateur courant fait parti du support';

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

create trigger after_insert_droit
    after insert
    on dcp
    for each row
execute procedure after_insert_dcp_add_rights();

COMMIT;
