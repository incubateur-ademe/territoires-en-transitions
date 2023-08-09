-- Deploy tet:evaluation/score_service to pg

BEGIN;

create function
    evaluation.service_regles()
    returns jsonb
    stable
begin
    atomic
    select jsonb_agg(sr) from evaluation.service_regles sr;
end;
comment on function evaluation.service_regles is
    'Toutes les règles d''évaluation de la vue `service_regles`.';

create function
    evaluation.identite(collectivite_id integer)
    returns jsonb
    stable
begin
    atomic
    select jsonb_build_object('population', ci.population,
                              'type', ci.type,
                              'localisation', ci.localisation)
    from collectivite_identite ci
    where ci.id = collectivite_id;
end;
comment on function evaluation.identite is
    'L''identité d''une collectivité pour le service d''évaluation.';

create function
    evaluation.current_service_configuration()
    returns evaluation.service_configuration
begin
    atomic
    select *
    from evaluation.service_configuration
    order by created_at desc
    limit 1;
end;
comment on function evaluation.current_service_configuration is
    'La dernière configuration en date du service d''évaluation.';

COMMIT;
