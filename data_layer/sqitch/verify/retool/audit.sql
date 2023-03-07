-- Verify tet:retool/audit on pg

BEGIN;

select collectivite_id, nom, referentiel, date_debut, date_fin, type_audit
from retool_audit
where false;

ROLLBACK;
