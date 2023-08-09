-- Deploy tet:labellisation/comparaison_audit to pg

BEGIN;

create table post_audit_scores
(
    like client_scores,
    audit_id integer references labellisation.audit on delete cascade,
    primary key (collectivite_id, referentiel, audit_id)
);

comment on table post_audit_scores
    is 'Les scores après audit.';

select private.add_modified_at_trigger('public', 'post_audit_scores');

alter table post_audit_scores
    enable row level security;
create policy allow_read
    on post_audit_scores for select
    using (true);

create trigger check_payload_timestamp
    before insert or update
    on post_audit_scores
    for each row
execute procedure prevent_older_results();

-- Réécrit les fonctions pour ajouter le choix de la date (début, fin) de l'audit
drop trigger after_write_update_audit_scores on labellisation.audit;
drop trigger after_write_update_audit_scores on personnalisation_consequence;
drop function labellisation.update_audit_scores;
drop function labellisation.update_audit_score_on_personnalisation;
drop function labellisation.evaluate_audit_statuts;
drop function labellisation.audit_personnalisation_payload;
drop function labellisation.audit_evaluation_payload;
drop function labellisation.pre_audit_service_statuts;
drop function labellisation.pre_audit_reponses;

-- Ancien labellisation.pre_audit_reponses
create function
    labellisation.json_reponses_at(
    collectivite_id integer,
    date_at timestamp with time zone
) returns jsonb stable
return (
    select coalesce(jsonb_agg(h.reponse), to_jsonb('{}'::jsonb[]))
    from historique.reponses_at(json_reponses_at.collectivite_id, json_reponses_at.date_at) h
);
comment on function labellisation.json_reponses_at is
    'Les réponses d''une collectivité à un moment donné au format json';

-- Ancien labellisation.pre_audit_service_statuts
create function labellisation.json_action_statuts_at(
    collectivite_id integer,
    referentiel referentiel,
    date_at timestamp with time zone
) returns jsonb stable
return
    (
        with statut as (
            select h.*
            from historique.action_statuts_at(
                         json_action_statuts_at.collectivite_id,
                         json_action_statuts_at.referentiel,
                         json_action_statuts_at.date_at
                     ) h
        )
        select jsonb_agg(evaluation.convert_statut(
                action_id,
                avancement,
                avancement_detaille,
                concerne))
        from statut
                 left join action_relation on statut.action_id = action_relation.id
    );
comment on function labellisation.json_action_statuts_at
    is 'Les statuts action au format JSON pour construire la payload.';

create function
    labellisation.audit_evaluation_payload(
    in audit labellisation.audit,
    in pre_audit boolean,
    out referentiel jsonb,
    out statuts jsonb,
    out consequences jsonb
) stable
begin
    atomic
    with statuts as (
        select labellisation.json_action_statuts_at(
                       audit.collectivite_id,
                       audit.referentiel,
                       case when pre_audit then audit.date_debut else audit.date_fin end
                   ) as data
    )
    select r.data                                    as referentiel,
           coalesce(s.data, to_jsonb('{}'::jsonb[])) as statuts,
           -- On n'utilise pas les conséquences de personnalisation
           -- elles sont calculées à chaque fois.
           to_jsonb('{}'::jsonb[])                   as consequences
    from evaluation.service_referentiel as r
             left join statuts s on true
    where r.referentiel = audit.referentiel;
end;
comment on function labellisation.audit_evaluation_payload is
    'La payload pour l''évaluation des statuts d'' audit.'
        'Argument pre_audit à vrai pour les statuts pre-audit et à faux pour les statuts post-audit.';

create function labellisation.audit_personnalisation_payload(
    audit_id integer,
    pre_audit boolean,
    scores_table text
) returns jsonb
begin
    atomic
    with
        la as (
            select * from labellisation.audit where id = audit_id
        ),
        -- Les payloads pour le calculs des scores des référentiels
        evaluation_payload as (
            select transaction_timestamp() as timestamp,
                   audit_personnalisation_payload.audit_id,
                   la.collectivite_id,
                   la.referentiel,
                   audit_personnalisation_payload.scores_table,
                   to_jsonb(ep)            as payload
            from la
                     join labellisation.audit_evaluation_payload(la, pre_audit) ep on true
        ),
        -- La payload de personnalisation qui contient les payloads d'évaluation.
        personnalisation_payload as (
            select transaction_timestamp()                           as timestamp,
                   la.collectivite_id                                as collectivite_id,
                   -- Dans le cas des scores pre-audit on enregistre pas les conséquences
                   ''                                                as consequences_table,
                   jsonb_build_object(
                           'identite', (select evaluation.identite(la.collectivite_id)),
                           'regles',(select evaluation.service_regles()),
                           'reponses',
                           (select labellisation.json_reponses_at(
                                           la.collectivite_id,
                                           case when pre_audit then la.date_debut else la.date_fin end
                                       )
                           )
                       )                                             as payload,
                   (select array_agg(ep) from evaluation_payload ep) as evaluation_payloads
            from la)
    select to_jsonb(pp.*)
    from personnalisation_payload pp;
end;
comment on function labellisation.audit_personnalisation_payload is
    'La payload pour la personnalisation et l''évaluation des statuts d''audit.'
        'Argument pre_audit à vrai pour les statuts pre-audit et à faux pour les statuts post-audit.';

create function labellisation.evaluate_audit_statuts(
    in audit_id integer,
    in pre_audit boolean,
    in scores_table varchar,
    out request_id bigint
) returns bigint security definer
begin
    atomic
    select post.*
    from evaluation.current_service_configuration() conf
             join labellisation.audit_personnalisation_payload(
            audit_id,
            pre_audit,
            scores_table
        ) pp on true
             join net.http_post(conf.personnalisation_endpoint, pp.*) post on true
    where conf is not null;
end;
-- permet au trigger d'utiliser l'extension http.
set search_path = public, net;
comment on function labellisation.evaluate_audit_statuts
    is 'Appel le service d''évaluation pour une collectivité et un référentiel avec les réponses aux questions et les statuts des actions. '
        'Les conséquences du calcul de personnalisation sont calculées chaque fois et ne sont pas stockées dans une table intermédiaire. '
        'Le service écrira une fois le calcul fait dans la table `scores_table`.'
        'Argument pre_audit à vrai pour les statuts pre-audit et à faux pour les statuts post-audit.';

create function labellisation.update_audit_scores() returns trigger as
$$
begin
    perform labellisation.evaluate_audit_statuts(new.id, true, 'pre_audit_scores');
    if new.date_fin is not null then
        perform labellisation.evaluate_audit_statuts(new.id, false, 'post_audit_scores');
    end if;
    return new;
end
$$ language plpgsql;

create trigger after_write_update_audit_scores
    after insert or update
    on labellisation.audit
    for each row
execute procedure labellisation.update_audit_scores();
comment on trigger after_write_update_audit_scores on labellisation.audit is
    'Mets à jour les scores d''audit.';

create function labellisation.update_audit_score_on_personnalisation() returns trigger as
$$
begin
    perform (
        with
            ref as (
                select unnest(enum_range(null::referentiel)) as referentiel
            ),
            audit as (
                select ca.id
                from ref
                         join labellisation.current_audit(new.collectivite_id, ref.referentiel) ca on true
            ),
            query as (
                select labellisation.evaluate_audit_statuts(audit.id, true, 'pre_audit_scores') as id
                from audit
            )
        select count(query)
        from query
    );
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
