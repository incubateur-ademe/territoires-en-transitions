-- Deploy tet:labellisation/comparaison_audit to pg

BEGIN;

drop function labellisation.evaluate_audit_statuts;
drop function labellisation.audit_personnalisation_payload;
drop function labellisation.audit_evaluation_payload;
drop function labellisation.pre_audit_reponses;

create or replace function
    labellisation.audit_evaluation_payload(
    in audit audit,
    out referentiel jsonb,
    out statuts jsonb,
    out consequences jsonb
)
    stable
begin
    atomic
    with statuts as (select labellisation.pre_audit_service_statuts(audit.id) as data),
         consequences as ( -- on ne garde que les conséquences du référentiel concerné
             select jsonb_object_agg(tuple.key, tuple.value) as filtered
             from personnalisation_consequence pc
                      join jsonb_each(pc.consequences) tuple on true
                      join action_relation ar on tuple.key = ar.id
             where pc.collectivite_id = audit.collectivite_id
               and ar.referentiel = audit.referentiel)
    select r.data                                        as referentiel,
           coalesce(s.data, to_jsonb('{}'::jsonb[]))     as statuts,
           coalesce(c.filtered, to_jsonb('{}'::jsonb[])) as consequences
    from evaluation.service_referentiel as r
             left join statuts s on true
             left join consequences c on true
    where r.referentiel = audit.referentiel;
end;
comment on function labellisation.audit_evaluation_payload
    is 'Construit la payload pour l''évaluation des statuts pre-audit.';


create or replace function
    labellisation.evaluate_audit_statuts(
    in audit_id integer,
    in scores_table varchar,
    out request_id bigint
)
as
$$
with audit as (select * from audit where id = audit_id),
     payload as (select transaction_timestamp() as timestamp,
                        evaluate_audit_statuts.audit_id,
                        audit.collectivite_id,
                        audit.referentiel,
                        evaluate_audit_statuts.scores_table,
                        to_jsonb(ep)            as payload
                 from audit
                          join labellisation.audit_evaluation_payload(audit) ep on true),
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
$$
    language sql
    security definer
    -- permet au trigger d'utiliser l'extension http.
    set search_path = public, net;
comment on function labellisation.evaluate_audit_statuts
    is 'Appel le service d''évaluation pour une collectivité et un référentiel. '
        'Le service écrira une fois le calcul fait dans la table `scores_table`.';


COMMIT;
