-- Deploy tet:evaluation/score_service to pg

BEGIN;

drop function evaluation.service_regles;
drop function evaluation.identite;
drop function evaluation.current_service_configuration;

COMMIT;
