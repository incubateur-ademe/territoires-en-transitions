-- Deploy tet:labellisation/comparaison_audit to pg

BEGIN;

drop function
    labellisation.evaluate_audit_statuts;
drop function
    labellisation.audit_evaluation_payload;

create function
    labellisation.audit_evaluation_payload(
    in audit labellisation.audit,
    out referentiel jsonb,
    out statuts jsonb,
    out consequences jsonb
)
    stable
begin
    atomic
    with statuts as (select labellisation.pre_audit_service_statuts(audit.id) as data)
    select r.data                                    as referentiel,
           coalesce(s.data, to_jsonb('{}'::jsonb[])) as statuts,
           -- On n'utilise pas les conséquences de personnalisation
           -- elles sont calculées à chaque fois.
           to_jsonb('{}'::jsonb[])                   as consequences
    from evaluation.service_referentiel as r
             left join statuts s on true
    where r.referentiel = audit.referentiel;
end;
comment on function labellisation.audit_evaluation_payload
    is 'Construit la payload pour l''évaluation des statuts pre-audit.';

create function
    labellisation.evaluate_audit_statuts(
    in audit_id integer,
    in scores_table varchar,
    out request_id bigint
)
as
$$
with audit as (select * from labellisation.audit where id = audit_id),
     -- Les payloads pour le calculs des scores des référentiels
     evaluation_payload as (select transaction_timestamp() as timestamp,
                                   evaluate_audit_statuts.audit_id,
                                   audit.collectivite_id,
                                   audit.referentiel,
                                   evaluate_audit_statuts.scores_table,
                                   to_jsonb(ep)            as payload
                            from labellisation.audit
                                     join labellisation.audit_evaluation_payload(audit) ep on true),
     -- La payload de personnalisation qui contient les payloads d'évaluation.
     personnalisation_payload as (select transaction_timestamp()                           as timestamp,
                                         ci.id                                             as collectivite_id,
                                         -- Dans le cas des scores pre-audit on enregistre pas les conséquences
                                         ''                                                as consequences_table,
                                         jsonb_build_object(
                                                 'identite', jsonb_build_object('population', ci.population,
                                                                                'type', ci.type,
                                                                                'localisation', ci.localisation),
                                                 'regles',
                                                 (select array_agg(sr) from evaluation.service_regles sr),
                                                 'reponses',
                                                 (select coalesce(jsonb_agg(hr.reponse), to_jsonb('{}'::jsonb[]))
                                                  from historique.reponses_at(audit.collectivite_id, audit.date_debut) hr)
                                             )                                             as payload,
                                         (select jsonb_agg(ep) from evaluation_payload ep) as evaluation_payloads
                                  from audit
                                           join collectivite_identite ci on audit.collectivite_id = ci.id),
     configuration as (select *
                       from evaluation.service_configuration
                       order by created_at desc
                       limit 1)

select post.*
from configuration -- si il n'y a aucune configuration on ne fait pas d'appel
         join personnalisation_payload pp on true
         left join lateral (select *
                            from net.http_post(
                                    configuration.personnalisation_endpoint,
                                    to_jsonb(pp.*)
                                )
    ) as post on true;
$$
    language sql
    security definer
    -- permet au trigger d'utiliser l'extension http.
    set search_path = public, net;
comment on function labellisation.evaluate_audit_statuts
    is 'Appel le service d''évaluation pour une collectivité et un référentiel avec les réponses aux questions et les statuts des actions. '
        'Les conséquences du calcul de personnalisation sont calculées chaque fois et ne sont pas stockées dans une table intermédiaire. '
        'Le service écrira une fois le calcul fait dans la table `scores_table`.';

COMMIT;
