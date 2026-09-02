-- Revert tet:collectivite/type_add_dr_ademe_service_national from pg

BEGIN;

ALTER TABLE collectivite
  DROP CONSTRAINT IF EXISTS collectivite_service_national_sans_code_geographique;

DROP INDEX IF EXISTS collectivite_dr_ademe_unique_region_code;

DELETE FROM private_utilisateur_droit
WHERE collectivite_id IN (SELECT id FROM collectivite WHERE type IN ('dr_ademe', 'service_national'));

DELETE FROM private_collectivite_membre
WHERE collectivite_id IN (SELECT id FROM collectivite WHERE type IN ('dr_ademe', 'service_national'));

DELETE FROM collectivite_bucket
WHERE collectivite_id IN (SELECT id FROM collectivite WHERE type IN ('dr_ademe', 'service_national'));

DELETE FROM collectivite WHERE type IN ('dr_ademe', 'service_national');

ALTER TABLE collectivite
  DROP CONSTRAINT IF EXISTS collectivite_type_check;

ALTER TABLE collectivite
  ADD CONSTRAINT collectivite_type_check
    CHECK (type IN ('epci', 'commune', 'region', 'departement', 'test', 'prefecture_region', 'prefecture_departement', 'service_public', 'structure_sans_statut_juridique', 'dreal', 'ddt'));

COMMIT;
