-- Deploy tet:stats/posthog to pg

BEGIN;

create or replace function
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
           trim(both '"' from to_json($1.time)::text)             as timestamp,
           $1.user_id                   as distinct_id,
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

create or replace function
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
           trim(both '"' from to_json($1.time)::text)                 as timestamp,
           $1.user_id                       as distinct_id,
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

create or replace function
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
           trim(both '"' from to_json($1.time)::text)                as timestamp,
           $1.user_id                      as distinct_id,
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

COMMIT;
