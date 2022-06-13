-- Revert tet:referentiel/business_update from pg

BEGIN;

drop function business_upsert_indicateurs;
drop function business_update_actions;
drop function business_insert_actions;

COMMIT;
