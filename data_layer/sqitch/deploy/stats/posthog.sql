-- Deploy tet:stats/posthog to pg

BEGIN;

create function
    posthog.creation_event(dcp)
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
    select 'compte_creation'                                 as event,
           trim(both '"' from to_json($1.modified_at)::text) as timestamp,
           $1.user_id                                        as distinct_id,
           json_build_object(
                   '$set', json_build_object('email', $1.email, 'name', $1.prenom || ' ' || $1.nom)
           )                                                 as properties;
end;
comment on function
    posthog.creation_event(dcp) is 'Événement de création de compte';


create view posthog.latest_score_modification
as
select collectivite_id,
       referentiel,
       max(statut.modified_at) as time
from action_statut statut
         join action_definition definition using (action_id)
group by collectivite_id, referentiel;
comment on view posthog.latest_score_modification is
    'Les dernières modification de scores.';


create function
    posthog.event(posthog.latest_score_modification)
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
    select 'score_modification'                       as event,
           trim(both '"' from to_json($1.time)::text) as timestamp,
           statut.modified_by                         as distinct_id,
           jsonb_build_object(
               -- utilisateur et collectivité
                   'collectivite_id', $1.collectivite_id::text,
                   'niveau_acces', d.niveau_acces,
                   '$set', jsonb_build_object('email', p.email, 'name', p.prenom || ' ' || p.nom),
                   '$groups', jsonb_build_object('collectivite', $1.collectivite_id::text),
               -- score
                   'referentiel', $1.referentiel,
                   'completude', score.completude
           ) || score.obj                             as properties
    from action_statut statut
             join action_definition def using (action_id)
             join dcp p on p.user_id = statut.modified_by
             join private_utilisateur_droit d
                  on d.user_id = statut.modified_by
                      and d.collectivite_id = $1.collectivite_id
             join lateral (select obj,
                                  (obj -> 'completed_taches_count')::double precision /
                                  (obj -> 'total_taches_count')::double precision * 100 as completude
                           from (select jsonb_array_elements(client_scores.scores) as obj
                                 from client_scores
                                 where collectivite_id = $1.collectivite_id
                                   and referentiel = $1.referentiel) as action_score
                           where obj @> jsonb_build_object('action_id', $1.referentiel::text)) score on true
    where $1.collectivite_id = statut.collectivite_id
      and $1.time = statut.modified_at
      and $1.referentiel = def.referentiel;
end;
comment on function posthog.event(posthog.latest_score_modification)
    is 'Crée un événement à partir d''une modification de score en utilisant la modification de statut correspondante.';


create or replace function
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
    where $1 @> time
    union all
    select to_jsonb(posthog.creation_event(dcp))
    from dcp
    where $1 @> dcp.created_at
    union all
    select to_jsonb(posthog.event(score_mod))
    from posthog.latest_score_modification score_mod
    where $1 @> score_mod.time;
end;


create function
    posthog.validate_event(jsonb)
    returns void
    language plpgsql
    immutable strict
as
$$
begin
    if $1 ->> 'event' is null then
        raise 'Un événement doit avoir un type : %', $1::text;
    end if;
    perform (select $1 ->> 'distinct_id')::uuid;
    perform (select $1 ->> 'timestamp')::date;
    return;
exception
    when invalid_text_representation then
        raise 'Un événement doit avoir un distinct_id valide : %', $1::text;
    when invalid_datetime_format then
        raise 'Un événement doit avoir un timestamp valide : %', $1::text;
end
$$;
comment on function
    posthog.validate_event(jsonb) is
    'Lève une erreur si l''événement n''est pas valide. '
        'On s''en sert pour tester en préprod.';

COMMIT;
