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
    with ref as (select unnest(enum_range(null::referentiel)) as referentiel),
         audit as (select ca.id
                   from ref
                            join labellisation.current_audit(new.collectivite_id, ref.referentiel) ca on true)
    select labellisation.evaluate_audit_statuts(audit.id, 'pre_audit_scores')
    from audit;
    return new;
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
    in collectivite_id integer,
    in referentiel referentiel,
    out referentiel referentiel,
    out action_id action_id,
    out score_realise float,
    out score_programme float,
    out score_realise_plus_programme float,
    out score_pas_fait float,
    out score_non_renseigne float,
    out points_restants float,
    out points_realises float,
    out points_programmes float,
    out points_max_personnalises float,
    out points_max_referentiel float
)
begin
    atomic
    select client_scores.referentiel as referentiel,
           sc.*
    from collectivite c
             -- on prend les scores au format json pour chaque référentiel
             join client_scores on client_scores.collectivite_id = c.id and client_scores.referentiel = referentiel
        -- que l'on explose en lignes, une par action
             join private.convert_client_scores(client_scores.scores) ccc on true
        -- puis on converti chacune de ces lignes au format approprié pour les vues tabulaires du client
             join private.to_tabular_score(ccc) sc on true
    where c.id = collectivite_id;
end;
comment on function private.collectivite_scores is
    'Les scores des actions pour une collectivité.';


create function
    private.collectivite_scores_pre_audit(
    in collectivite_id integer,
    in referentiel referentiel,
    out referentiel referentiel,
    out action_id action_id,
    out score_realise float,
    out score_programme float,
    out score_realise_plus_programme float,
    out score_pas_fait float,
    out score_non_renseigne float,
    out points_restants float,
    out points_realises float,
    out points_programmes float,
    out points_max_personnalises float,
    out points_max_referentiel float
)
begin
    atomic
    select pre_audit_scores.referentiel as referentiel, sc.*
    from collectivite c
             -- on prend les scores au format json pour chaque référentiel
             join pre_audit_scores
                  on pre_audit_scores.collectivite_id = c.id and pre_audit_scores.referentiel = referentiel
        -- que l'on explose en lignes, une par action
             join private.convert_client_scores(pre_audit_scores.scores) ccc on true
        -- puis on converti chacune de ces lignes au format approprié pour les vues tabulaires du client
             join private.to_tabular_score(ccc) sc on true
    where c.id = collectivite_id;
end;
comment on function private.collectivite_scores_pre_audit is
    'Les scores des actions avant audit en cours pour une collectivité.';


create view comparaison_scores_audit
as
with ref as (select unnest(enum_range(null::referentiel)) as referentiel),

     current_scores as (select c.id as collectivite_id,
                               s.*
                        from collectivite c
                                 join ref on true
                                 join private.collectivite_scores(c.id, ref.referentiel) s on true),
     pre_audit_scores as (select c.id as collectivite_id,
                                 s.*
                          from collectivite c
                                   join ref on true
                                   join private.collectivite_scores_pre_audit(c.id, ref.referentiel) s on true)
select cs.collectivite_id,
       cs.referentiel,
       cs.action_id,
       to_jsonb(cs)  as score_courant,
       to_jsonb(pas) as score_pre_audit
from current_scores cs
         join pre_audit_scores pas
              on cs.collectivite_id = pas.collectivite_id
                  and cs.action_id = pas.action_id;
comment on view comparaison_scores_audit
    is 'Permet de comparer les scores pre audit avec ceux de l''audit en cours.';


COMMIT;
