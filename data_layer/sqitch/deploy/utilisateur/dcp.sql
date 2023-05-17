-- Deploy tet:dcp to pg
-- requires: base

BEGIN;

alter table dcp
    add verifie boolean default false;

alter table dcp
    add support boolean default false;

create function est_verifie()
    returns boolean
    security definer
begin 
    atomic
    select dcp.verifie 
    from dcp
    where dcp.user_id = auth.uid()
    and is_authenticated();
end;
comment on function est_verifie is 'Vrai si l''utilisateur courant est vérifié';

create function est_support()
    returns boolean
    security definer
begin
    atomic
    select dcp.support
    from dcp
    where dcp.user_id = auth.uid()
    and is_authenticated();
end;
comment on function est_support is 'Vrai si l''utilisateur courant fait parti du support';

create function before_insert_check_support() returns trigger
as
$$
begin
    if new.email like '%@ademe.fr' then
        new.support = true;
    end if;
    return new;
end;
$$ language plpgsql;
comment on function before_insert_check_support() is 'Un email @ademe.fr est automatiquement support';

create trigger before_insert_support
    before insert
    on dcp
    for each row
execute procedure before_insert_check_support();

-- Met à jour le retour de la requête avec les nouvelles colonnes
create or replace function accepter_cgu()
    returns dcp
begin atomic
update dcp
set cgu_acceptees_le = now()
where user_id = auth.uid()
returning *;
end;

COMMIT;
