-- Deploy tet:referentiel/action_precision_history to pg
-- requires: history_schema
-- requires: utilisateur/droits_v2
-- requires: referentiel/action_commentaire

BEGIN;

create table history.action_precision
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
alter table history.action_precision
    enable row level security;


create function history.save_action_precision() returns trigger
as
$$
declare
    updated integer;
begin
    update history.action_precision
    set precision          = new.commentaire,
        previous_precision = old.commentaire,
        modified_at        = new.modified_at
    where id in (select id
                 from history.action_precision
                 where collectivite_id = new.collectivite_id
                   and action_id = new.action_id
                   and modified_by = new.modified_by
                   and modified_at > new.modified_at - interval '1 hour'
                 order by modified_by desc
                 limit 1)
    returning id into updated;


    if updated is null
    then
        --  raise notice 'updated %', updated;
        insert into history.action_precision
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
execute procedure history.save_action_precision();


create view historical_action_precision
as
with action_history as (select *
                        from history.action_precision
                        order by modified_at desc),
     actions as (select * from action_hierarchy ah where ah.type = 'action')
select h.action_id                                                               as tache_id,
       ah.action_id                                                              as action_id,
       td.identifiant                                                            as tache_identifiant,
       td.nom                                                                    as tache_nom,
       ad.identifiant                                                            as action_identifiant,
       ad.nom                                                                    as action_nom,
       collectivite_id,
       precision,
       previous_precision,
       modified_by                                                               as modified_by_id,
       h.modified_at,
       coalesce(ud.prenom || ' ' || ud.nom, 'Équipe territoires en transitions') as modified_by_nom
from action_history h
         join actions ah on h.action_id = any (ah.descendants)
         join action_definition ad on ah.action_id = ad.action_id -- definition de l'action
         join action_definition td on h.action_id = td.action_id -- definition de la tache
         left join utilisateur.dcp_display ud on h.modified_by = ud.user_id
;
comment on view historical_action_precision is
    'Historique des modification des précisions.';


COMMIT;
