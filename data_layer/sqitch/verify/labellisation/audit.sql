-- Verify tet:labellisation/audit on pg

BEGIN;

select id,
       collectivite_id,
       referentiel,
       demande_id,
       date_debut,
       date_fin,
       valide,
       date_cnl,
       valide_labellisation,
       clos
from labellisation.audit
where false;

select has_function_privilege('labellisation.update_audit()', 'execute');
select has_function_privilege('labellisation.audit_personnalisation_payload(integer, boolean, text)', 'execute');
select has_function_privilege('labellisation.update_labellisation_after_scores()', 'execute');

ROLLBACK;
