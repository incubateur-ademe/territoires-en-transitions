-- Deploy tet:labellisation/comparaison_audit to pg

BEGIN;

-- Stockage des scores pre-audit.

create table pre_audit_scores
(
    like client_scores,
    audit_id integer references audit,
    primary key (collectivite_id, referentiel, audit_id)
);
comment on table pre_audit_scores
    is 'Les scores avant audit.';

-- maintient le modified at à jour.
select private.add_modified_at_trigger('public', 'pre_audit_scores');

-- tout le monde peut lire la table
alter table pre_audit_scores
    enable row level security;
create policy allow_read
    on pre_audit_scores for select
    using (true);

-- les résultats d'une payload plus ancienne ne peuvent pas écraser les nouveaux
create trigger check_payload_timestamp
    before insert or update
    on pre_audit_scores
    for each row
execute procedure prevent_older_results();


-- Evaluation des statuts pre-audit

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


create function
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


create function labellisation.update_audit_scores() returns trigger as
$$
begin
    perform labellisation.evaluate_audit_statuts(new.id, 'pre_audit_scores');
    return new;
end
$$ language plpgsql;

create trigger after_write_update_audit_scores
    after insert or update
    on audit
    for each row
execute procedure labellisation.update_audit_scores();
comment on trigger after_write_update_audit_scores on audit is
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


create function
    private.collectivite_scores(
    collectivite_id integer,
    referentiel referentiel
)
    returns setof tabular_score
begin
    atomic
    select sc.*
    from client_scores
             join private.convert_client_scores(client_scores.scores) ccc on true
             join private.to_tabular_score(ccc) sc on true
    where client_scores.collectivite_id = collectivite_scores.collectivite_id
      and client_scores.referentiel = collectivite_scores.referentiel;
end;
comment on function private.collectivite_scores is
    'Les scores des actions pour une collectivité.';


create function
    private.collectivite_scores_pre_audit(
    collectivite_id integer,
    referentiel referentiel
)
    returns setof tabular_score
begin
    atomic
    select sc.*
    from pre_audit_scores
             join private.convert_client_scores(pre_audit_scores.scores) ccc on true
             join private.to_tabular_score(ccc) sc on true
    where pre_audit_scores.collectivite_id = collectivite_scores_pre_audit.collectivite_id
      and pre_audit_scores.referentiel = collectivite_scores_pre_audit.referentiel;
end;
comment on function private.collectivite_scores_pre_audit is
    'Les scores des actions avant audit en cours pour une collectivité.';


create function
    private.collectivite_score_comparaison(
    collectivite_id integer,
    referentiel referentiel
)
    returns table
            (
                referentiel referentiel,
                courant     tabular_score,
                pre_audit   tabular_score
            )
begin
    atomic
    with courant as (select private.collectivite_scores(collectivite_id, referentiel) as score),
         pre_audit as (select private.collectivite_scores_pre_audit(collectivite_id, referentiel) as score)
    select referentiel,
           courant.score,
           pre_audit.score
    from courant
             join pre_audit on (pre_audit.score).action_id = (courant.score).action_id;
end;


create view comparaison_scores_audit
as
with ref as (select unnest(enum_range(null::referentiel)) as referentiel)
select c.id as collectivite_id,
       sc.referentiel,
       (sc.courant).action_id,
       sc.courant,
       sc.pre_audit
from collectivite c
         join ref on true
         join lateral private.collectivite_score_comparaison(c.id, ref.referentiel) sc on true
order by collectivite_id, referentiel, naturalsort((sc.courant).action_id);
comment on view comparaison_scores_audit
    is 'Permet de comparer les scores pre audit avec ceux de l''audit en cours.';


COMMIT;
