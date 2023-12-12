-- Deploy tet:stats/posthog to pg

BEGIN;

create or replace function
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
    select '$pageview'                                as event,
           trim(both '"' from to_json($1.time)::text) as timestamp,
           $1.user_id                                 as distinct_id,
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
           )                                          as properties
    from dcp p
    where p.user_id = $1.user_id;
end;

create or replace function
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
           trim(both '"' from to_json($1.modified_at)::text) as timestamp,
           $1.user_id                                        as distinct_id,
           json_build_object('$set', posthog.properties($1)) as properties;
end;

COMMIT;
