-- Deploy tet:stats/posthog to pg

BEGIN;

create schema posthog;

create function posthog.properties(dcp) returns setof jsonb
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
                   'fonction_referent', 'referent' = any (f.list),
                   'fonction_conseiller', 'conseiller' = any (f.list),
                   'fonction_technique', 'technique' = any (f.list),
                   'fonction_politique', 'politique' = any (f.list),
                   'fonction_partenaire', 'partenaire' = any (f.list)
           )
    from f;
end;
comment on function posthog.properties(dcp) is 'Les user properties pour PostHog.';

create function
    posthog.event(dcp)
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
    select '$identify'                                       as event,
           to_json($1.modified_at)                           as timestamp,
           $1.user_id                                        as distinct_id,
           json_build_object('$set', posthog.properties($1)) as properties;
end;
comment on function posthog.event(dcp) is 'Un event de type identify pour mettre à jour les données sur PostHog.';


create function
    posthog.event(visite)
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
                   '$set', posthog.properties(p),
                   '$groups', json_build_object('collectivite', $1.collectivite_id::text)
           )                as properties
    from dcp p
    where p.user_id = $1.user_id;
end;
comment on function posthog.event(visite) is 'Un event de type pageview.';

create function
    posthog.event(usage)
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
                   '$set', posthog.properties(p),
                   '$groups', json_build_object('collectivite', $1.collectivite_id::text)
           )                               as properties
    from dcp p
    where p.user_id = $1.user_id;
end;
comment on function posthog.event(usage) is 'Un event de type pageview.';


create function
    posthog.event(public.collectivite)
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
as
$$ -- `crm_usages` étant amené à changer on utilise une chaine de caractères
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
$$;
comment on function posthog.event(public.collectivite) is 'Un event de type $groupidentify pour mettre à jour les données sur PostHog.';


create view posthog.modification
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
comment on view posthog.modification is 'Les actions de modification destinées à être transformées en events.';

create view posthog.creation
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
comment on view posthog.creation is 'Les actions de creation destinées à être transformées en events.';

create function
    posthog.event(posthog.creation)
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
comment on function posthog.event(posthog.creation) is 'Événement de creation.';

create function
    posthog.event(posthog.modification)
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
comment on function posthog.event(posthog.modification) is 'Événement de modification.';

create function
    posthog.event(tstzrange)
    returns setof jsonb
    language sql
    stable
    security definer
begin
    atomic
    select to_jsonb(posthog.event(v))
    from visite v
    where $1 @> time
    union all
    select to_jsonb(posthog.event(u))
    from usage u
    where $1 @> time
    union all
    select to_jsonb(posthog.event(e))
    from posthog.modification e
    where $1 @> time
    union all
    select to_jsonb(posthog.event(e))
    from posthog.creation e
    where $1 @> time;
end;
comment on function posthog.event(tstzrange) is 'Événement(s) en jsonb pour une plage de temps.';


create table posthog.configuration
(
    id      serial primary key,
    api_url text not null,
    api_key text not null
);
comment on table posthog.configuration is 'La configuration de PostHog.';

create function
    posthog.send_events(events jsonb)
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
    from posthog.configuration conf
    order by id desc
    limit 1;
end;
comment on function posthog.send_events is 'Envoie un lot d''événements à PostHog.';

COMMIT;
