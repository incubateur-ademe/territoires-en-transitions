-- Deploy tet:referentiel/action_precision_history to pg
-- requires: history_schema
-- requires: utilisateur/droits_v2
-- requires: referentiel/action_commentaire

BEGIN;

create table historique.action_precision
(
    id                   serial primary key,
    collectivite_id      integer                  not null,
    action_id            action_id                not null,
    precision            text                     not null,
    previous_precision   text,
    modified_by          uuid,
    previous_modified_by uuid,
    modified_at          timestamp with time zone not null,
    previous_modified_at timestamp with time zone
);
alter table historique.action_precision
    enable row level security;


create function historique.save_action_precision() returns trigger
as
$$
declare
    updated integer;
begin
    update historique.action_precision
    set precision          = new.commentaire,
        modified_at        = new.modified_at
    where id in (select id
                 from historique.action_precision
                 where collectivite_id = new.collectivite_id
                   and action_id = new.action_id
                   and modified_by = new.modified_by
                   and modified_at > new.modified_at - interval '1 hour'
                 order by modified_by desc
                 limit 1)
    returning id into updated;

    if updated is null
    then
        insert into historique.action_precision
        values (default,
                new.collectivite_id,
                new.action_id,
                new.commentaire,
                old.commentaire,
                auth.uid(),
                old.modified_by,
                new.modified_at,
                old.modified_at);
    end if;

    return new;
end;
$$ language plpgsql security definer;

create trigger save_history
    after insert or update
    on action_commentaire
    for each row
execute procedure historique.save_action_precision();

COMMIT;
