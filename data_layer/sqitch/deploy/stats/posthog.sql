-- Deploy tet:stats/posthog to pg

BEGIN;

create function stats.posthog_properties(dcp) returns jsonb
    language sql
    stable security definer
begin
    atomic
    return json_build_object(
            'email', $1.email,
            'name', $1.prenom || ' ' || $1.nom,
            'fonctions',
            (select array_agg(distinct m.fonction)
             from private_collectivite_membre m
                      join private_utilisateur_droit pud
                           on m.user_id = pud.user_id and m.collectivite_id = pud.collectivite_id
             where m.user_id = $1.user_id
               and m.fonction is not null
               and pud.active),
            'auditeur', ($1.user_id in (table auditeurs))
           );
end;

create function
    stats.posthog_event(visite)
    returns table
            (
                event       text,
                timestamp   text,
                distinct_id text,
                properties  jsonb
            )
    language sql
    stable
    security definer
    rows 1
begin
    atomic
    select '$pageview'     as event,
           v.user_id       as distinct_id,
           to_json(v.time) as timestamp,
           json_build_object(
                   '$current_url',
                   'app/' || (case when v.collectivite_id is null then '' else 'collectivite/' end) || v.page,
                   'page', v.page,
                   'tag', v.tag,
                   'onglet', v.onglet,
                   'collectivite_id', v.collectivite_id::text,
                   'niveau_acces', d.niveau_acces,
                   '$set', stats.posthog_properties(p),
                   '$groups', json_build_object('collectivite', c.collectivite_id::text)
           )               as properties

    from $1 v
             join collectivite c using (collectivite_id)
             join private_utilisateur_droit d using (user_id, collectivite_id)
             join dcp p using (user_id);
end;


create function
    stats.posthog_event(usage)
    returns table
            (
                event       text,
                timestamp   text,
                distinct_id text,
                properties  jsonb
            )
    language sql
    stable
    security definer
    rows 1
begin
    atomic
    select u.fonction || '_' || u.action as event,
           u.user_id                     as distinct_id,
           to_json(u.time)               as timestamp,
           json_build_object(
                   '$current_url',
                   'app/' || (case when u.collectivite_id is null then '' else 'collectivite/' end) || u.page,
                   'page', u.page,
                   'collectivite_id', u.collectivite_id::text,
                   'niveau_acces', d.niveau_acces,
                   '$set', stats.posthog_properties(p),
                   '$groups', json_build_object('collectivite', c.collectivite_id::text)
           )                             as properties

    from $1 u
             join collectivite c using (collectivite_id)
             join private_utilisateur_droit d using (user_id, collectivite_id)
             join dcp p using (user_id);
end;


create function
    stats.posthog_event(collectivite)
    returns table
            (
                event       text,
                distinct_id text,
                properties  jsonb
            )
    language sql
    stable
    security definer
    rows 1
begin
    atomic
    select '$groupidentify'        as event,
           c.collectivite_id::text as distinct_id,
           json_build_object(
                   '$group_type', 'collectivite',
                   '$group_key', c.collectivite_id::text,
                   '$group_set', to_jsonb(c) || to_jsonb(scu)
           )                       as properties
    from $1 c
             join stats.crm_usages scu on c.id = scu.collectivite_id
             join stats.collectivite sc using (collectivite_id);
end;


create view stats.modification_event
as
select 'reponse'       as type,
       modified_at     as time,
       modified_by     as user_id,
       collectivite_id as collectivite_id
from historique.reponse_binaire
where modified_by is not null
union all
select 'reponse', modified_at, modified_by, collectivite_id
from historique.reponse_choix
where modified_by is not null
union all
select 'reponse', modified_at, modified_by, collectivite_id
from historique.reponse_proportion
where modified_by is not null
union all
select 'justification', modified_at, modified_by, collectivite_id
from historique.justification
where modified_by is not null;

create view stats.creation_event
as
select 'fiche'         as type,
       created_at      as time,
       modified_by     as user_id,
       collectivite_id as collectivite_id
from fiche_action
where modified_by is not null
union all
select 'plan', created_at, modified_by, collectivite_id
from axe
where parent is null
  and modified_by is not null
union all
select 'discussion', created_at, created_by, collectivite_id
from action_discussion;

create function
    stats.posthog_event(stats.creation_event)
    returns table
            (
                event       text,
                timestamp   text,
                distinct_id text,
                properties  jsonb
            )
    language sql
    stable
    security definer
    rows 1
begin
    atomic
    select ev.type || '_' || 'creation' as event,
           ev.user_id                   as distinct_id,
           to_json(ev.time)             as timestamp,
           json_object(
                   'collectivite_id', ev.collectivite_id::text,
                   'niveau_acces', d.niveau_acces,
                   '$set', json_object('email', p.email, 'name', p.prenom || ' ' || p.nom),
                   '$groups', json_object('collectivite', c.collectivite_id::text)
           )                            as properties

    from $1 ev
             join collectivite c using (collectivite_id)
             join private_utilisateur_droit d using (user_id, collectivite_id)
             join dcp p using (user_id)
    order by ev.time;
end;

create function
    stats.posthog_event(stats.modification_event)
    returns table
            (
                event       text,
                timestamp   text,
                distinct_id text,
                properties  jsonb
            )
    language sql
    stable
    security definer
    rows 1
begin
    atomic
    select ev.type || '_' || 'modification' as event,
           ev.user_id                       as distinct_id,
           to_json(ev.time)                 as timestamp,
           json_object(
                   'collectivite_id', ev.collectivite_id::text,
                   'niveau_acces', d.niveau_acces,
                   '$set', json_object('email', p.email, 'name', p.prenom || ' ' || p.nom),
                   '$groups', json_object('collectivite', c.collectivite_id::text)
           )                                as properties

    from $1 ev
             join collectivite c using (collectivite_id)
             join private_utilisateur_droit d using (user_id, collectivite_id)
             join dcp p using (user_id)
    order by ev.time;
end;


create table stats.posthog_configuration
(
    id      serial primary key,
    api_url text not null,
    api_key text not null
);

create function
    stats.send_posthog_events(events jsonb[])
    returns bigint
begin
    atomic

    select net.http_post(
                   url := conf.api_url,
                   body := jsonb_build_object(
                           'api_key', conf.api_key,
                           'batch', $1
                           )
           )
    from stats.posthog_configuration conf
    order by id desc
    limit 1;
end;


COMMIT;
