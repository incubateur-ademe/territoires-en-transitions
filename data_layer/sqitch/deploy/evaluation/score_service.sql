-- Deploy tet:evaluation/score_service to pg

BEGIN;

-- remove deprecated triggers and tables
drop trigger after_action_statut_insert on action_statut;
drop function after_action_statut_insert_write_event;
drop view unprocessed_action_statut_update_event;
drop table action_statut_update_event;

drop trigger after_reponse_binaire_write on reponse_binaire;
drop trigger after_reponse_choix_write on reponse_choix;
drop trigger after_reponse_proportion_write on reponse_proportion;
drop view unprocessed_reponse_update_event;
drop table reponse_update_event;

-- ajoute la colonne `payload_timestamp` pour éviter le scénario
--- où l'écriture des scores ou des conséquences suivant la première payload arrive après la dernière.
alter table client_scores
    add payload_timestamp timestamptz;

alter table personnalisation_consequence
    add payload_timestamp timestamptz;


create function prevent_older_results()
returns trigger
as
$$
begin
    if old is null or new.payload_timestamp > old.payload_timestamp
    then
        return new;
    else
        perform set_config('response.status', '409', true);
        raise 'Results from a newer payload already exists.';
    end if;
end
$$ language plpgsql;

create trigger check_payload_timestamp
    before insert or update on client_scores
    for each row
    execute procedure prevent_older_results();

create trigger check_payload_timestamp
    before insert or update on personnalisation_consequence
    for each row
    execute procedure prevent_older_results();


create table evaluation.service_configuration
(
    evaluation_endpoint       varchar                   not null,
    personnalisation_endpoint varchar                   not null,
    created_at                timestamptz default now() not null
);
comment on table evaluation.service_configuration
    is 'Les URLs des endpoints du service d''évaluation. '
        'Seul les endpoints de la configuration la plus récente sont appelés. '
        'Lorsque cette table est vide les endpoints ne sont pas appelés.';

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
comment on view evaluation.service_reponses
    is 'Les réponses des collectivité au format JSON, inclues dans les payload envoyées au service.';

create view evaluation.service_regles
as
select action_id,
       jsonb_agg(jsonb_build_object('type', pr.type, 'formule', formule)) as regles
from personnalisation_regle pr
group by action_id;
comment on view evaluation.service_regles
    is 'Les règles qui s''appliquent aux actions au format JSON, inclues dans les payload envoyées au service.';

create materialized view evaluation.service_referentiel
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
       jsonb_build_object(
               'action_level', case when c.referentiel = 'cae' then 3 else 2 end,
               'children', c.data,
               'computed_points', p.data
           ) as data
from children c
         left join computed_points p on c.referentiel = p.referentiel;
comment on materialized view evaluation.service_referentiel
    is 'Les référentiels au format JSON pour l''évaluation par le business.'
        'Coûteuse à construire elle est rafraichie lors de la mise à jour des référentiels';


-- Modifie le trigger de mise à jour du contenu suite à l'insertion de json.
create or replace function
    private.upsert_referentiel_after_json_insert()
    returns trigger
as
$$
declare
begin
    -- Met à jour le contenu.
    perform private.upsert_actions(new.definitions, new.children);
    -- Rafraichit la vue des référentiels utilisée pour l'évaluation.
    refresh materialized view evaluation.service_referentiel;
    return new;
end;
$$ language plpgsql
    -- Nécessite les droits sur la vue matérialisée pour la rafraichir.
    security definer;


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
comment on view evaluation.service_statuts
    is 'Les statuts des action au format JSON, inclus dans les payload envoyées au service.';

create function
    evaluation.evaluation_payload(
    in collectivite_id integer,
    in referentiel referentiel,
    out referentiel jsonb,
    out statuts jsonb,
    out consequences jsonb
)
as
$$
with statuts as (select s.data
                 from evaluation.service_statuts s
                 where s.referentiel = evaluation_payload.referentiel
                   and s.collectivite_id = evaluation_payload.collectivite_id),
     consequences as ( -- on ne garde que les conséquences du référentiel concerné
         select jsonb_object_agg(tuple.key, tuple.value) as filtered
         from personnalisation_consequence pc
                  join jsonb_each(pc.consequences) tuple on true
                  join action_relation ar on tuple.key = ar.id
         where pc.collectivite_id = evaluation_payload.collectivite_id
           and ar.referentiel = evaluation_payload.referentiel)
select r.data                                        as referentiel,
       coalesce(s.data, to_jsonb('{}'::jsonb[]))     as statuts,
       coalesce(c.filtered, to_jsonb('{}'::jsonb[])) as consequences
from evaluation.service_referentiel as r
         left join statuts s on true
         left join consequences c on true
where r.referentiel = evaluation_payload.referentiel
$$ language sql stable;
comment on function evaluation.evaluation_payload
    is 'Construit la payload pour l''évaluation des statuts.';


create function
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
comment on function evaluation.evaluate_statuts
    is 'Appel le service d''évaluation pour une collectivité et un référentiel. '
        'Le service écrira une fois le calcul fait dans la table `scores_table`.';

create function
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
comment on function evaluation.evaluate_regles
    is 'Appel le service d''évaluation pour une collectivité. '
        'Le service écrira une fois les conséquences de personnalisation calculée dans la table `consequences_table`. '
        'Puis le service écrira pour chaque référentiel les scores dans la table `scores_table`.';


-- Les triggers
create function after_reponse_call_business() returns trigger as
$$
declare
begin
    perform evaluation.evaluate_regles(
            new.collectivite_id,
            'personnalisation_consequence',
            'client_scores'
        );
    return new;
end
$$ language plpgsql security definer;

create trigger after_reponse_insert
    after insert or update
    on reponse_binaire
    for each row
execute procedure after_reponse_call_business();

create trigger after_reponse_insert
    after insert or update
    on reponse_choix
    for each row
execute procedure after_reponse_call_business();

create trigger after_reponse_insert
    after insert or update
    on reponse_proportion
    for each row
execute procedure after_reponse_call_business();

create function after_action_statut_call_business() returns trigger as
$$
declare
    relation action_relation%ROWTYPE;
begin
    select * into relation from action_relation where id = new.action_id limit 1;
    perform evaluation.evaluate_statuts(new.collectivite_id, relation.referentiel, 'client_scores');
    return new;
end
$$ language plpgsql security definer;

create trigger after_action_statut_insert
    after insert or update
    on action_statut
    for each row
execute procedure after_action_statut_call_business();


COMMIT;
