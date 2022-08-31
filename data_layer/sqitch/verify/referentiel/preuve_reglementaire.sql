-- Verify tet:referentiel/preuve_reglementaire on pg

BEGIN;

select *
from preuve_reglementaire_definition
where false;

select has_function_privilege('business_upsert_preuves(preuve_reglementaire_definition[])', 'execute');

ROLLBACK;
