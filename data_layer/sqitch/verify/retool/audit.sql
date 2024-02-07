-- Verify tet:retool/audit on pg

BEGIN;

select collectivite_id,
       nom,
       referentiel,
       date_debut,
       date_fin,
       date_cnl,
       valide_labellisation,
       clos,
       type_audit,
       etoiles,
       date_demande,
       date_attribution_auditeur,
       audit_id,
       demande_id
from retool_audit
where false;

select has_function_privilege('retool_update_audit(integer, timestamptz, timestamptz, timestamptz, boolean, boolean, boolean)', 'execute');


ROLLBACK;
