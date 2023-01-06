-- Verify tet:labellisation/audit on pg

BEGIN;

select collectivite_id, referentiel, audit, is_cot
from audits
where false;

select id, collectivite_id, referentiel, demande_id, date_debut, date_fin, valide
from audit_en_cours
where false;

ROLLBACK;
