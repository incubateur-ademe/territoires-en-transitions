-- Verify tet:labellisation/audit on pg

BEGIN;

select collectivite_id, audit_id, referentiel, noms
from auditeurs
where false;

ROLLBACK;
