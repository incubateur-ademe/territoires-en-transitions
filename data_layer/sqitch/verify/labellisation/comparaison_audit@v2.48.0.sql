-- Verify tet:labellisation/comparaison_audit on pg

BEGIN;

select has_function_privilege('labellisation.update_audit_scores()', 'execute');
select has_function_privilege('labellisation.update_audit_score_on_personnalisation()', 'execute');
select has_function_privilege('labellisation.evaluate_audit_statuts(integer, boolean, varchar)', 'execute');
select has_function_privilege('labellisation.audit_personnalisation_payload(integer, boolean, text)', 'execute');
select has_function_privilege('labellisation.audit_evaluation_payload(labellisation.audit, boolean)', 'execute');
select has_function_privilege('labellisation.json_action_statuts_at(integer, referentiel, timestamp with time zone)', 'execute');
select has_function_privilege('labellisation.json_reponses_at(integer, timestamp with time zone)', 'execute');

select collectivite_id, referentiel, scores, modified_at, payload_timestamp, audit_id
from post_audit_scores
where false;

ROLLBACK;
