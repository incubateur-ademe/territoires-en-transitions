-- Deploy tet:referentiel/clean-import-json-table to pg

BEGIN;

drop view if exists evaluation.late_collectivite;

drop view  if exists evaluation.content_latest_update;

drop table if exists preuve_reglementaire_json;

drop function if exists labellisation.upsert_preuves_reglementaire_after_json_insert;

drop table if exists personnalisations_json;

drop function if exists private.upsert_personnalisations_after_json_insert;

drop function if exists private.upsert_regles;

drop function if exists private.upsert_questions;

drop table if exists referentiel_json;

drop function if exists private.upsert_referentiel_after_json_insert;

drop function if exists private.upsert_actions;

COMMIT;
