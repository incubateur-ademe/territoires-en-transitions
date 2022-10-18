-- Deploy tet:evaluation/score_service to pg

BEGIN;

-- todo move in evaluation service
create table evaluation.service_configuration
(
    evaluation_endpoint       varchar                   not null,
    personnalisation_endpoint varchar                   not null,
    created_at                timestamptz default now() not null
);

insert into evaluation.service_configuration
values ('http://business:8888/evaluation/', 'http://business:8888/personnalisation/');


-- todo move in personnalisation service
create view evaluation.service_reponses
as
with r as (select q.id                                                                 as question_id,
                  coalesce(rb.collectivite_id, rp.collectivite_id, rc.collectivite_id) as collectivite_id,
                  case
                      when q.type = 'binaire'
                          then
                          case
                              when rb.reponse
                                  then jsonb_build_object('id', q.id,
                                                          'value', 'OUI')
                              else
                                  jsonb_build_object('id', q.id,
                                                     'value', 'NON')
                              end
                      when q.type = 'proportion'
                          then jsonb_build_object('id', q.id,
                                                  'value', rp.reponse)
                      when q.type = 'choix'
                          then jsonb_build_object('id', q.id,
                                                  'value', rc.reponse)
                      end                                                              as reponse
           from question q
                    left join reponse_binaire rb on rb.question_id = q.id and rb.reponse is not null
                    left join reponse_proportion rp on rp.question_id = q.id and rp.reponse is not null
                    left join reponse_choix rc on rc.question_id = q.id and rc.reponse is not null)
select r.collectivite_id,
       jsonb_agg(r.reponse) as reponses
from r
where r.collectivite_id is not null
group by r.collectivite_id;

create view evaluation.service_regles
as
select action_id,
       jsonb_agg(jsonb_build_object('type', pr.type, 'formule', formule)) as regles
from personnalisation_regle pr
group by action_id;



create or replace function
    evaluation.evaluate_regles(
    in collectivite_id integer,
    out status integer,
    out content_type varchar,
    out http_header http_header[],
    out content varchar
)
as
$$
with payload as (select jsonb_build_object(
                                'identite', jsonb_build_object('population', ci.population,
                                                               'type', ci.type,
                                                               'localisation',
                                                               ci.localisation), -- si il n'y a pas de statuts
                                'regles', (select jsonb_agg(to_jsonb(sr)) from evaluation.service_regles sr),
                                'reponses',
                                (select reponses from evaluation.service_reponses sr where sr.collectivite_id = ci.id)
                            ) as data
                 from collectivite_identite ci
                 where ci.id = evaluate_regles.collectivite_id)
select post.*
from payload
         left join lateral (select *
                            from http_post(
                                    (select personnalisation_endpoint
                                     from evaluation.service_configuration
                                     order by created_at desc
                                     limit 1),
                                    payload.data::varchar,
                                    'application/json'::varchar
                                )
    ) as post on true
$$
    language sql
    security definer
    set search_path = public, extensions; -- permet d'utiliser l'extension http depuis un trigger



create or replace function after_reponse_call_business() returns trigger as
$$
declare
begin
    raise notice 'calling business for collectivite %', new.collectivite_id;

    insert into personnalisation_consequence (collectivite_id, consequences)
    select 1, content::jsonb
    from evaluation.evaluate_regles(new.collectivite_id)
        -- todo handle failure
    on conflict (collectivite_id)
        do update set consequences = excluded.consequences,
                      modified_at  = excluded.modified_at;
    return new;
end
$$ language plpgsql security definer;

create trigger after_reponse_insert
    after insert or update
    on reponse_binaire -- todo other reponse types
    for each row
execute procedure after_reponse_call_business();

-- todo keep in score service
-- remove deprecated triggers
drop trigger after_action_statut_insert on action_statut;
-- drop function after_action_statut_insert_write_event;
-- drop table action_statut_update_event;

create view evaluation.service_referentiel
as
with computed_points as (select referentiel,
                                jsonb_agg(jsonb_build_object(
                                        'referentiel', ar.referentiel,
                                        'action_id', acp.action_id,
                                        'value', value
                                    )) as data
                         from action_computed_points acp
                                  join action_relation ar on acp.action_id = ar.id
                         group by referentiel),
     children as (select referentiel,
                         jsonb_agg(jsonb_build_object(
                                 'referentiel', referentiel,
                                 'action_id', ac.id,
                                 'children', children)) as data
                  from action_children ac
                           join action_relation ar on ac.id = ar.id
                  group by referentiel)

select c.referentiel,
       json_build_object(
               'action_level', 2, -- todo
               'children', c.data,
               'computed_points', p.data
           ) as data
from children c
         left join computed_points p on c.referentiel = p.referentiel;


create view evaluation.service_statuts
as
select collectivite_id,
       referentiel,
       jsonb_agg(jsonb_build_object(
               'action_id', action_id,
               'detailed_avancement',
               case
                   when avancement = 'fait' then jsonb_build_object(
                           'fait', 1.0,
                           'programme', 0.0,
                           'pas_fait', 0.0
                       )
                   when avancement = 'programme' then jsonb_build_object(
                           'fait', 0.0,
                           'programme', 1.0,
                           'pas_fait', 0.0
                       )
                   when avancement = 'pas_fait' then jsonb_build_object(
                           'fait', 0.0,
                           'programme', 0.0,
                           'pas_fait', 1.0
                       )
                   when avancement = 'detaille' then jsonb_build_object(
                           'fait', avancement_detaille[1],
                           'programme', avancement_detaille[2],
                           'pas_fait', avancement_detaille[3]
                       )
                   end,
               'concerne', concerne
           )) as data
from action_statut
         left join action_relation on action_statut.action_id = action_relation.id
group by collectivite_id, referentiel;


create or replace function
    evaluation.evaluate_statuts(
    in collectivite_id integer,
    in referentiel referentiel,
    out status integer,
    out content_type varchar,
    out http_header http_header[],
    out content varchar
)
as
$$
with payload as (select jsonb_build_object(
                                'statuts', coalesce(s.data, to_jsonb('{}'::jsonb[])), -- si il n'y a pas de statuts
                                'evaluation_referentiel', r.data,
                                'consequences', jsonb_build_object() -- todo
                            ) as data
                 from evaluation.service_referentiel as r
                          left join evaluation.service_statuts s on s.referentiel = r.referentiel
                 where r.referentiel = evaluate_statuts.referentiel
                   and s.collectivite_id = evaluate_statuts.collectivite_id)

select post.*
from payload
         left join lateral (select *
                            from http_post(
                                    (select evaluation_endpoint
                                     from evaluation.service_configuration
                                     order by created_at desc
                                     limit 1),
                                    payload.data::varchar,
                                    'application/json'::varchar
                                )
    ) as post on true
$$
    language sql
    security definer
    set search_path = public, extensions;


-- todo do not use a trigger to avoid long transactions on statuts updates
create or replace function after_action_statut_call_business() returns trigger as
$$
declare
    relation action_relation%ROWTYPE;
begin
    select * into relation from action_relation where id = new.action_id limit 1;

    raise notice 'calling business for collectivite %, %', new.collectivite_id, relation.referentiel;

    insert into client_scores (collectivite_id, referentiel, scores, score_created_at)
    select new.collectivite_id, relation.referentiel, content::jsonb, now()
    from evaluation.evaluate_statuts(new.collectivite_id, relation.referentiel)
        -- todo handle failure
    on conflict (collectivite_id, referentiel)
        do update set scores           = excluded.scores,
                      score_created_at = excluded.score_created_at;
    return new;
end
$$ language plpgsql security definer;

create trigger after_action_statut_insert
    after insert or update
    on action_statut
    for each row
execute procedure after_action_statut_call_business();

COMMIT;
