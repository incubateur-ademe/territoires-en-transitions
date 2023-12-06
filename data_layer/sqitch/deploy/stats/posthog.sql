-- Deploy tet:stats/posthog to pg

BEGIN;

create function stats.posthog_properties(dcp) returns setof jsonb
    language sql
    stable
    security definer
    rows 1
begin
    atomic
    with f as (select array_agg(distinct m.fonction) as list
               from private_utilisateur_droit pud
                        join stats.collectivite_active ca using (collectivite_id)
                        join private_collectivite_membre m using (user_id, collectivite_id)
               where m.user_id = $1.user_id)
    select json_build_object(
                   'email', $1.email,
                   'name', $1.prenom || ' ' || $1.nom,
                   'auditeur', exists((select a.auditeur from audit_auditeur a where a.auditeur = $1.user_id)),
                   'fonction_referent', coalesce('referent' = any (f.list), false),
                   'fonction_conseiller', coalesce('conseiller' = any (f.list), false),
                   'fonction_technique', coalesce('technique' = any (f.list), false),
                   'fonction_politique', coalesce('politique' = any (f.list), false),
                   'fonction_partenaire', coalesce('partenaire' = any (f.list), false)
           )
    from f;
end;

create function
    stats.posthog_event(visite)
    returns table
            (
                event       text,
                "timestamp" text,
                distinct_id text,
                properties  jsonb
            )
    language sql
    stable
    security definer
    rows 1
begin
    atomic
    select '$pageview'      as event,
           $1.user_id       as distinct_id,
           to_json($1.time) as timestamp,
           json_build_object(
                   '$current_url',
                   'app/' || (case when $1.collectivite_id is null then '' else 'collectivite/' end) || $1.page,
                   'page', $1.page,
                   'tag', $1.tag,
                   'onglet', $1.onglet,
                   'collectivite_id', $1.collectivite_id::text,
                   'niveau_acces', (select niveau_acces
                                    from private_utilisateur_droit pud
                                    where pud.collectivite_id = $1.collectivite_id
                                      and pud.user_id = $1.user_id),
                   '$set', stats.posthog_properties(p),
                   '$groups', json_build_object('collectivite', $1.collectivite_id::text)
           )                as properties
    from dcp p
    where p.user_id = $1.user_id;
end;

create function
    stats.posthog_event(usage)
    returns table
            (
                event       text,
                "timestamp" text,
                distinct_id text,
                properties  jsonb
            )
    language sql
    stable
    security definer
    rows 1
begin
    atomic
    select $1.fonction || '_' || $1.action as event,
           $1.user_id                      as distinct_id,
           to_json($1.time)                as timestamp,
           json_build_object(
                   '$current_url',
                   'app/' || (case when $1.collectivite_id is null then '' else 'collectivite/' end) || $1.page,
                   'page', $1.page,
                   'collectivite_id', $1.collectivite_id::text,
                   'niveau_acces', (select niveau_acces
                                    from private_utilisateur_droit pud
                                    where pud.collectivite_id = $1.collectivite_id
                                      and pud.user_id = $1.user_id),
                   '$set', stats.posthog_properties(p),
                   '$groups', json_build_object('collectivite', $1.collectivite_id::text)
           )                               as properties
    from dcp p
    where p.user_id = $1.user_id;
end;


create function
    stats.posthog_event(public.collectivite)
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
    select '$groupidentify' as event,
           $1.id::text      as distinct_id,
           json_build_object(
                   '$group_type', 'collectivite',
                   '$group_key', $1.id::text,
                   '$group_set', to_jsonb(sc) || to_jsonb(scu)
           )                as properties
    from stats.collectivite sc
             join stats.crm_usages scu using (collectivite_id)
    where $1.id = scu.collectivite_id;
end;


create view stats.modification_event
as
select 'reponse'       as type,
       modified_at     as time,
       modified_by     as user_id,
       collectivite_id as collectivite_id
from historique.reponse_binaire
         join stats.collectivite_active using (collectivite_id)
where modified_by is not null
union all
select 'reponse', modified_at, modified_by, collectivite_id
from historique.reponse_choix
         join stats.collectivite_active using (collectivite_id)
where modified_by is not null
union all
select 'reponse', modified_at, modified_by, collectivite_id
from historique.reponse_proportion
         join stats.collectivite_active using (collectivite_id)
where modified_by is not null
union all
select 'justification', modified_at, modified_by, collectivite_id
from historique.justification
         join stats.collectivite_active using (collectivite_id)
where modified_by is not null;

create view stats.creation_event
as
select 'fiche'         as type,
       created_at      as time,
       modified_by     as user_id,
       collectivite_id as collectivite_id
from fiche_action
         join stats.collectivite_active using (collectivite_id)
where modified_by is not null
union all
select 'plan', created_at, modified_by, collectivite_id
from axe
         join stats.collectivite_active using (collectivite_id)
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
                "timestamp" text,
                distinct_id text,
                properties  jsonb
            )
    language sql
    stable
    security definer
    rows 1
begin
    atomic
    select $1.type || '_' || 'creation' as event,
           $1.user_id                   as distinct_id,
           to_json($1.time)             as timestamp,
           json_build_object(
                   'collectivite_id', $1.collectivite_id::text,
                   'niveau_acces', d.niveau_acces,
                   '$set', json_build_object('email', p.email, 'name', p.prenom || ' ' || p.nom),
                   '$groups', json_build_object('collectivite', $1.collectivite_id::text)
           )                            as properties

    from private_utilisateur_droit d
             join dcp p using (user_id)
    where $1.collectivite_id = d.collectivite_id
      and $1.user_id = d.user_id;
end;

create function
    stats.posthog_event(stats.modification_event)
    returns table
            (
                event       text,
                "timestamp" text,
                distinct_id text,
                properties  jsonb
            )
    language sql
    stable
    security definer
    rows 1
begin
    atomic
    select $1.type || '_' || 'modification' as event,
           $1.user_id                       as distinct_id,
           to_json($1.time)                 as timestamp,
           json_build_object(
                   'collectivite_id', $1.collectivite_id::text,
                   'niveau_acces', d.niveau_acces,
                   '$set', json_build_object('email', p.email, 'name', p.prenom || ' ' || p.nom),
                   '$groups', json_build_object('collectivite', $1.collectivite_id::text)
           )                                as properties

    from private_utilisateur_droit d
             join dcp p using (user_id)
    where $1.collectivite_id = d.collectivite_id
      and $1.user_id = d.user_id;
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

create function
    stats.posthog_event(range tstzrange)
    returns setof jsonb
    language sql
    stable
    security definer
begin
    atomic
    select to_jsonb(stats.posthog_event(v))
    from visite v
    where $1 @> time
    union all
    select to_jsonb(stats.posthog_event(u))
    from usage u
    where $1 @> time
    union all
    select to_jsonb(stats.posthog_event(e))
    from stats.modification_event e
    where $1 @> time
    union all
    select to_jsonb(stats.posthog_event(e))
    from stats.creation_event e
    where $1 @> time;
end;

COMMIT;
