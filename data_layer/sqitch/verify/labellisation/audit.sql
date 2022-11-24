-- Verify tet:labellisation/audit on pg

BEGIN;
select id, collectivite_id, referentiel, demande_id, date_debut, date_fin
from audit
where false;

select audit_id, auditeur
from audit_auditeur
where false;

select id, audit_id, action_id, collectivite_id, modified_by, modified_at, ordre_du_jour, avis, statut
from labellisation.action_audit_state
where false;

select has_function_privilege('labellisation.current_audit(integer, referentiel)', 'execute');
ROLLBACK;
