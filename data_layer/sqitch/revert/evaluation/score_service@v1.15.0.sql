-- Deploy tet:evaluation/score_service to pg

BEGIN;

drop function evaluation.evaluate_statuts;
drop function evaluation.evaluate_regles;

create or replace function
    evaluation.evaluate_statuts(
    in collectivite_id integer,
    in referentiel referentiel,
    in scores_table varchar,
    out status integer,
    out content_type varchar,
    out http_header http_header[],
    out content varchar
)
as
$$
with payload as (select transaction_timestamp()       as timestamp,
                        evaluate_statuts.collectivite_id,
                        evaluate_statuts.referentiel,
                        evaluate_statuts.scores_table as scores_table,
                        to_jsonb(ep)                  as payload
                 from evaluation.evaluation_payload(evaluate_statuts.collectivite_id, evaluate_statuts.referentiel) ep),
     configuration as (select *
                       from evaluation.service_configuration
                       order by created_at desc
                       limit 1)
select post.*
from configuration -- si il n'y a aucune configuration on ne fait pas d'appel
         join payload on true
         left join lateral (select *
                            from http_post(
                                    configuration.evaluation_endpoint,
                                    to_jsonb(payload.*)::varchar,
                                    'application/json'::varchar
                                )
    ) as post on true
$$
    language sql
    security definer
    -- permet au trigger d'utiliser l'extension http.
    set search_path = public, extensions;

create or replace function
    evaluation.evaluate_regles(
    in collectivite_id integer,
    in consequences_table varchar,
    in scores_table varchar,
    out status integer,
    out content_type varchar,
    out http_header http_header[],
    out content varchar
)
as
$$
with ref as (select unnest(enum_range(null::referentiel)) as referentiel),
-- les payloads pour le calculs des scores des référentiels
     evaluation_payload as (select transaction_timestamp()      as timestamp,
                                   evaluate_regles.collectivite_id,
                                   ref.referentiel              as referentiel,
                                   evaluate_regles.scores_table as scores_table,
                                   ep                           as payload
                            from ref
                                     left join evaluation.evaluation_payload(
                                    evaluate_regles.collectivite_id,
                                    ref.referentiel) ep on true),
     -- la payload de personnalisation qui contient les payloads d'évaluation.
     personnalisation_payload as (select transaction_timestamp()                           as timestamp,
                                         ci.id                                             as collectivite_id,
                                         evaluate_regles.consequences_table                as consequences_table,
                                         jsonb_build_object(
                                                 'identite', jsonb_build_object('population', ci.population,
                                                                                'type', ci.type,
                                                                                'localisation', ci.localisation),
                                                 'regles',
                                                 (select array_agg(sr) from evaluation.service_regles sr),
                                                 'reponses',
                                                 coalesce((select reponses
                                                           from evaluation.service_reponses sr
                                                           where sr.collectivite_id = ci.id),
                                                          to_jsonb('{}'::jsonb[]))
                                             )                                             as payload,
                                         (select array_agg(ep) from evaluation_payload ep) as evaluation_payloads
                                  from collectivite_identite ci
                                  where ci.id = evaluate_regles.collectivite_id),
     configuration as (select *
                       from evaluation.service_configuration
                       order by created_at desc
                       limit 1)

select post.*
from configuration -- si il n'y a aucune configuration on ne fait pas d'appel
         join personnalisation_payload pp on true
         left join lateral (
    -- appel le business avec la payload.
    select *
    from http_post(
            configuration.personnalisation_endpoint,
            to_jsonb(pp.*)::varchar,
            'application/json'::varchar
        )
    ) as post on true
$$
    language sql
    security definer
-- permet d'utiliser l'extension http depuis un trigger
    set search_path = public, extensions;

COMMIT;
