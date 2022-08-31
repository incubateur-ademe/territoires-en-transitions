-- Revert tet:referentiel/preuve_reglementaire from pg

BEGIN;

drop function business_upsert_preuves(preuve_reglementaire_definition[]);
drop table preuve_reglementaire_definition;
drop domain preuve_id;

COMMIT;
