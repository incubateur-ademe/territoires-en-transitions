-- Verify tet:labellisation/comparaison_audit on pg

BEGIN;

select has_function_privilege('labellisation.pre_audit_reponses(labellisation.audit)', 'execute');
select has_function_privilege('labellisation.audit_evaluation_payload(labellisation.audit)', 'execute');
select has_function_privilege('labellisation.evaluate_audit_statuts(integer, varchar)', 'execute');
select has_function_privilege('labellisation.audit_personnalisation_payload(integer, text)', 'execute');

ROLLBACK;
