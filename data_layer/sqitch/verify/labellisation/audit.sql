-- Verify tet:labellisation/audit on pg

BEGIN;

select id, collectivite_id, referentiel, demande_id, auditeur, date_debut, date_fin, statut
from audit
where false;

select id, audit_id, action_id, collectivite_id, modified_by, modified_at, ordre_du_jour, avis, statut
from action_audit_state
where false;

select has_function_privilege('get_current_audit(integer, referentiel)', 'execute');
select has_function_privilege('set_audit_id()', 'execute');

ROLLBACK;