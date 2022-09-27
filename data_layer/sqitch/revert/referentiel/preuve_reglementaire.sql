-- Revert tet:referentiel/preuve_reglementaire from pg

BEGIN;

drop trigger after_preuve_json on preuve_reglementaire_json;
drop function labellisation.upsert_preuves_reglementaire(jsonb);
drop function labellisation.upsert_preuves_reglementaire_after_json_insert();
drop table preuve_action;
drop table preuve_reglementaire_definition;
drop table preuve_reglementaire_json;
drop domain preuve_id;

COMMIT;
