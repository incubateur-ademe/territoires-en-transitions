-- Verify tet:labellisation/comparaison_audit on pg

BEGIN;

select has_function_privilege('labellisation.audit_evaluation_payload(labellisation.audit, boolean)', 'execute');

ROLLBACK;
