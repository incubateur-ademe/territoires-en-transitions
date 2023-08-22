-- Deploy tet:labellisation/comparaison_audit to pg

BEGIN;

drop trigger after_write_update_audit_scores on labellisation.audit;
drop trigger after_write_update_audit_scores on personnalisation_consequence;
drop function labellisation.update_audit_scores;
drop function labellisation.update_audit_score_on_personnalisation;
drop function labellisation.evaluate_audit_statuts;
drop function labellisation.audit_personnalisation_payload;
drop function labellisation.audit_evaluation_payload;
drop function labellisation.json_action_statuts_at;
drop function labellisation.json_reponses_at;

drop table post_audit_scores;

create function labellisation.pre_audit_service_statuts(audit_id integer)
    returns jsonb
    stable
return
    (with statut as (select h.*
                     from audit
                              join historique.action_statuts_at(
                             audit.collectivite_id,
                             audit.referentiel,
                             audit.date_debut) h on true
                     where audit.id = audit_id)
     select jsonb_agg(evaluation.convert_statut(
             action_id,
             avancement,
             avancement_detaille,
             concerne))
     from statut
              left join action_relation on statut.action_id = action_relation.id);
comment on function labellisation.pre_audit_service_statuts
    is 'Les statuts pre-audit au format JSON pour construire la payload.';

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
    is 'La payload pour l''évaluation des statuts pre-audit.';

create function
    labellisation.pre_audit_reponses(audit labellisation.audit)
    returns jsonb
    stable
begin
    atomic
    select coalesce(jsonb_agg(hr.reponse), to_jsonb('{}'::jsonb[]))
    from historique.reponses_at(audit.collectivite_id, audit.date_debut) hr;
end;
comment on function labellisation.pre_audit_reponses is
    'Les réponses d''une collectivité au moment du commencement de l''audit.';

create function
    labellisation.audit_personnalisation_payload(audit_id integer, scores_table text)
    returns jsonb
begin
    atomic
    with la as (select * from labellisation.audit where id = audit_id),
         -- Les payloads pour le calculs des scores des référentiels
         evaluation_payload as (select transaction_timestamp() as timestamp,
                                       audit_personnalisation_payload.audit_id,
                                       la.collectivite_id,
                                       la.referentiel,
                                       audit_personnalisation_payload.scores_table,
                                       to_jsonb(ep)            as payload
                                from la
                                         join labellisation.audit_evaluation_payload(la) ep on true),
         -- La payload de personnalisation qui contient les payloads d'évaluation.
         personnalisation_payload as (select transaction_timestamp()                           as timestamp,
                                             la.collectivite_id                                as collectivite_id,
                                             -- Dans le cas des scores pre-audit on enregistre pas les conséquences
                                             ''                                                as consequences_table,
                                             jsonb_build_object(
                                                     'identite', (select evaluation.identite(la.collectivite_id)),
                                                     'regles',
                                                     (select evaluation.service_regles()),
                                                     'reponses',
                                                     (select labellisation.pre_audit_reponses(la))
                                                 )                                             as payload,
                                             (select array_agg(ep) from evaluation_payload ep) as evaluation_payloads
                                      from la)
    select to_jsonb(pp.*)
    from personnalisation_payload pp;
end;
comment on function labellisation.audit_personnalisation_payload is
    'La payload pour la personnalisation et l''évaluation des statuts pre-audit..';

create function
    labellisation.evaluate_audit_statuts(
    in audit_id integer,
    in scores_table varchar,
    out request_id bigint
)
    returns bigint
    security definer
begin
    atomic
    select post.*
    from evaluation.current_service_configuration() conf -- si il n'y a aucune configuration on ne fait pas d'appel
             join labellisation.audit_personnalisation_payload(audit_id, scores_table) pp on true
             join net.http_post(conf.personnalisation_endpoint, pp.*) post on true
    where conf is not null;
end;
-- permet au trigger d'utiliser l'extension http.
set search_path = public, net;
comment on function labellisation.evaluate_audit_statuts
    is 'Appel le service d''évaluation pour une collectivité et un référentiel avec les réponses aux questions et les statuts des actions. '
        'Les conséquences du calcul de personnalisation sont calculées chaque fois et ne sont pas stockées dans une table intermédiaire. '
        'Le service écrira une fois le calcul fait dans la table `scores_table`.';

create function labellisation.update_audit_scores() returns trigger as
$$
begin
    perform labellisation.evaluate_audit_statuts(new.id, 'pre_audit_scores');
    return new;
end
$$ language plpgsql;

create trigger after_write_update_audit_scores
    after insert or update
    on labellisation.audit
    for each row
execute procedure labellisation.update_audit_scores();
comment on trigger after_write_update_audit_scores on labellisation.audit is
    'Mets à jour les scores pre-audit.';

create function labellisation.update_audit_score_on_personnalisation() returns trigger as
$$
begin
    perform (with ref as (select unnest(enum_range(null::referentiel)) as referentiel),
                  audit as (select ca.id
                            from ref
                                     join labellisation.current_audit(new.collectivite_id, ref.referentiel) ca on true),
                  query as (select labellisation.evaluate_audit_statuts(audit.id, 'pre_audit_scores') as id
                            from audit)
             select count(query)
             from query);
    return new;
exception
    when others then return new;
end
$$ language plpgsql;

create trigger after_write_update_audit_scores
    after insert or update
    on personnalisation_consequence
    for each row
execute procedure labellisation.update_audit_score_on_personnalisation();
comment on trigger after_write_update_audit_scores on personnalisation_consequence is
    'Mets à jour les scores pre-audit si un audit est en cours.';

COMMIT;
