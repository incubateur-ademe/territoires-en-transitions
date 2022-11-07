-- Verify tet:evaluation/score_service on pg

BEGIN;

comment on trigger after_action_statut_insert on action_statut is '';
select has_function_privilege('after_action_statut_call_business()', 'execute');

comment on trigger after_reponse_insert on reponse_binaire is '';
comment on trigger after_reponse_insert on reponse_choix is '';
comment on trigger after_reponse_insert on reponse_proportion is '';

select has_function_privilege('after_reponse_call_business()', 'execute');

select has_function_privilege('evaluation.evaluation_payload( integer, referentiel )', 'execute');
select has_function_privilege('evaluation.evaluate_statuts( integer, referentiel, varchar )', 'execute');
select has_function_privilege('evaluation.evaluate_regles( integer, varchar, varchar )', 'execute');

select collectivite_id, referentiel, data
from evaluation.service_statuts
where false;

select referentiel, data
from evaluation.service_referentiel
where false;

select action_id, regles
from evaluation.service_regles
where false;

select collectivite_id, reponses
from evaluation.service_reponses
where false;

select evaluation_endpoint, personnalisation_endpoint, created_at
from evaluation.service_configuration
where false;

ROLLBACK;
