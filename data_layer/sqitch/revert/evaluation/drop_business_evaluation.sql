-- Revert tet:evaluation/drop_business_evaluation from pg

BEGIN;

-- Certaines fonctions référencent des vues déjà supprimées avant ce changement.
set local check_function_bodies = off;

create schema evaluation;
comment on schema evaluation is
    'Regroupe des fonctions privées afin que le schema public ne comprenne que les éléments pour l''API.';
grant usage on schema evaluation to anon, authenticated, service_role;

create type evaluation.update as enum ('statut', 'réponse', 'activation');

create table evaluation.service_configuration
(
    evaluation_endpoint       varchar                  not null,
    personnalisation_endpoint varchar                  not null,
    created_at                timestamp with time zone not null default now()
);

create view evaluation.service_reponses as
 WITH r AS (
         SELECT q.id AS question_id,
            COALESCE(rb.collectivite_id, rp.collectivite_id, rc.collectivite_id) AS collectivite_id,
                CASE
                    WHEN (q.type = 'binaire'::question_type) THEN
                    CASE
                        WHEN rb.reponse THEN jsonb_build_object('id', q.id, 'value', 'OUI')
                        ELSE jsonb_build_object('id', q.id, 'value', 'NON')
                    END
                    WHEN (q.type = 'proportion'::question_type) THEN jsonb_build_object('id', q.id, 'value', rp.reponse)
                    WHEN (q.type = 'choix'::question_type) THEN jsonb_build_object('id', q.id, 'value', rc.reponse)
                    ELSE NULL::jsonb
                END AS reponse
           FROM (((question q
             LEFT JOIN reponse_binaire rb ON ((((rb.question_id)::text = (q.id)::text) AND (rb.reponse IS NOT NULL))))
             LEFT JOIN reponse_proportion rp ON ((((rp.question_id)::text = (q.id)::text) AND (rp.reponse IS NOT NULL))))
             LEFT JOIN reponse_choix rc ON ((((rc.question_id)::text = (q.id)::text) AND (rc.reponse IS NOT NULL))))
        )
 SELECT r.collectivite_id,
    jsonb_agg(r.reponse) AS reponses
   FROM r
  WHERE (r.collectivite_id IS NOT NULL)
  GROUP BY r.collectivite_id;

create view evaluation.collectivite_latest_update as
 WITH recent AS (
         SELECT action_statut.collectivite_id,
            max(action_statut.modified_at) AS latest,
            'statut'::evaluation.update AS type
           FROM action_statut
          GROUP BY action_statut.collectivite_id
        UNION ALL
         SELECT reponse_choix.collectivite_id,
            max(reponse_choix.modified_at) AS max,
            'réponse'::evaluation.update
           FROM reponse_choix
          GROUP BY reponse_choix.collectivite_id
        UNION ALL
         SELECT reponse_binaire.collectivite_id,
            max(reponse_binaire.modified_at) AS max,
            'réponse'::evaluation.update
           FROM reponse_binaire
          GROUP BY reponse_binaire.collectivite_id
        UNION ALL
         SELECT reponse_proportion.collectivite_id,
            max(reponse_proportion.modified_at) AS max,
            'réponse'::evaluation.update
           FROM reponse_proportion
          GROUP BY reponse_proportion.collectivite_id
        UNION ALL
         SELECT private_utilisateur_droit.collectivite_id,
            max(private_utilisateur_droit.modified_at) AS max,
            'activation'::evaluation.update
           FROM private_utilisateur_droit
          WHERE private_utilisateur_droit.active
          GROUP BY private_utilisateur_droit.collectivite_id
         HAVING (count(*) = 1)
        )
 SELECT recent.collectivite_id,
    recent.latest,
    recent.type
   FROM recent
  ORDER BY recent.latest DESC;

CREATE OR REPLACE FUNCTION evaluation.identite(collectivite_id integer)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
BEGIN ATOMIC
 SELECT jsonb_build_object('population', ci.population, 'type', ci.type, 'localisation', ci.localisation) AS jsonb_build_object
    FROM collectivite_identite ci
   WHERE (ci.id = identite.collectivite_id);
END

;

CREATE OR REPLACE FUNCTION evaluation.convert_statut(action_id action_id, avancement avancement, avancement_detaille double precision[], concerne boolean)
 RETURNS jsonb
 LANGUAGE sql
RETURN (SELECT jsonb_build_object('action_id', action_id, 'detailed_avancement', CASE WHEN (avancement = 'fait'::avancement) THEN jsonb_build_object('fait', 1.0, 'programme', 0.0, 'pas_fait', 0.0) WHEN (avancement = 'programme'::avancement) THEN jsonb_build_object('fait', 0.0, 'programme', 1.0, 'pas_fait', 0.0) WHEN (avancement = 'pas_fait'::avancement) THEN jsonb_build_object('fait', 0.0, 'programme', 0.0, 'pas_fait', 1.0) WHEN (avancement = 'detaille'::avancement) THEN jsonb_build_object('fait', (avancement_detaille)[1], 'programme', (avancement_detaille)[2], 'pas_fait', (avancement_detaille)[3]) ELSE NULL::jsonb END, 'concerne', concerne) AS jsonb_build_object)

;

CREATE OR REPLACE FUNCTION evaluation.current_service_configuration()
 RETURNS evaluation.service_configuration
 LANGUAGE sql
BEGIN ATOMIC
 SELECT service_configuration.evaluation_endpoint,
     service_configuration.personnalisation_endpoint,
     service_configuration.created_at
    FROM evaluation.service_configuration
   ORDER BY service_configuration.created_at DESC
  LIMIT 1;
END

;

CREATE OR REPLACE FUNCTION evaluation.evaluation_payload(collectivite_id integer, referentiel referentiel, OUT referentiel jsonb, OUT statuts jsonb, OUT consequences jsonb)
 RETURNS record
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
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
select r.data                                    as referentiel,
       coalesce(s.data, to_jsonb('{}'::jsonb[])) as statuts,
       coalesce(c.filtered, '{}'::jsonb)         as consequences
from evaluation.service_referentiel as r
         left join statuts s on true
         left join consequences c on true
where r.referentiel = evaluation_payload.referentiel
$function$

;

CREATE OR REPLACE FUNCTION evaluation.evaluate_statuts(collectivite_id integer, referentiel referentiel, scores_table character varying, OUT request_id bigint)
 RETURNS bigint
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'net'
AS $function$
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
                            from net.http_post(
                                    configuration.evaluation_endpoint,
                                    to_jsonb(payload.*)
                                )
    ) as post on true
$function$

;

CREATE OR REPLACE FUNCTION evaluation.evaluate_regles(collectivite_id integer, consequences_table character varying, scores_table character varying, OUT request_id bigint)
 RETURNS bigint
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'net'
AS $function$
with ref as (select unnest(ARRAY['eci'::referentiel, 'cae'::referentiel]) as referentiel),
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
    from net.http_post(
            configuration.personnalisation_endpoint,
            to_jsonb(pp.*)
        )
    ) as post on true
$function$

;

CREATE OR REPLACE FUNCTION evaluation.update_late_collectivite_scores(max integer)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
select evaluation.evaluate_regles(collectivite_id,
                                  'personnalisation_consequence',
                                  'client_scores')
from evaluation.late_collectivite
where late
order by data desc
limit update_late_collectivite_scores.max;
$function$

;

CREATE OR REPLACE FUNCTION public.after_action_statut_call_business()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
    relation action_relation%ROWTYPE;
begin
    select * into relation from action_relation where id = new.action_id limit 1;
    perform evaluation.evaluate_statuts(new.collectivite_id, relation.referentiel, 'client_scores');
    return new;
exception -- si l'appel lève une erreur on continue.
    when others then return new;
end
$function$

;

create trigger after_action_statut_insert
    after insert or update
    on public.action_statut
    for each row
execute function public.after_action_statut_call_business();

comment on table evaluation.service_configuration is 'Les URLs des endpoints du service d''évaluation. Seul les endpoints de la configuration la plus récente sont appelés. Lorsque cette table est vide les endpoints ne sont pas appelés.';
comment on view evaluation.service_reponses is 'Les réponses des collectivité au format JSON, inclues dans les payload envoyées au service.';
comment on view evaluation.collectivite_latest_update is 'Les derniers changement des données des collectivités.';
comment on function evaluation.update_late_collectivite_scores(integer) is 'Appel le service d''évaluation pour un maximum de [max] collectivités en retard.';
comment on function evaluation.convert_statut(action_id,avancement,double precision[],boolean) is 'Convertit les statuts des action au format JSON, inclus dans les payload envoyées au service.';
comment on function evaluation.evaluate_statuts(integer,referentiel,character varying) is 'Appel le service d''évaluation pour une collectivité et un référentiel. Le service écrira une fois le calcul fait dans la table `scores_table`.';
comment on function evaluation.evaluate_regles(integer,character varying,character varying) is 'Appel le service d''évaluation pour une collectivité. Le service écrira une fois les conséquences de personnalisation calculée dans la table `consequences_table`. Puis le service écrira pour chaque référentiel les scores dans la table `scores_table`.';
comment on function evaluation.current_service_configuration() is 'La dernière configuration en date du service d''évaluation.';
comment on function evaluation.evaluation_payload(integer,referentiel) is 'Construit la payload pour l''évaluation des statuts.';
comment on function evaluation.identite(integer) is 'L''identité d''une collectivité pour le service d''évaluation.';
comment on type evaluation.update is 'Le type de changement dans les données qui peut nécessiter une évaluation.';

COMMIT;
