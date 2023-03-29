-- Verify tet:labellisation/audit on pg

BEGIN;

select has_function_privilege('labellisation.update_audit()', 'execute');
select has_function_privilege('labellisation_peut_commencer_audit(integer, referentiel)', 'execute');
select has_function_privilege('labellisation_commencer_audit(integer, timestamptz)', 'execute');
select audit_id, auditeur, created_at
from audit_auditeur
where false;

ROLLBACK;
