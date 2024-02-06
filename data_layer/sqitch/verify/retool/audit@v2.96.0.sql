-- Verify tet:retool/audit on pg

BEGIN;

select collectivite_id,
       nom,
       referentiel,
       date_debut,
       date_fin,
       type_audit,
       envoyee_le,
       date_attribution
from retool_audit
where false;

ROLLBACK;
