-- Revert tet:collectivite/type_add_ddt from pg

BEGIN;

DROP INDEX IF EXISTS collectivite_ddt_unique_departement_code;

DELETE FROM private_utilisateur_droit
WHERE collectivite_id IN (SELECT id FROM collectivite WHERE type = 'ddt');

DELETE FROM private_collectivite_membre
WHERE collectivite_id IN (SELECT id FROM collectivite WHERE type = 'ddt');

DELETE FROM collectivite_bucket
WHERE collectivite_id IN (SELECT id FROM collectivite WHERE type = 'ddt');

DELETE FROM collectivite WHERE type = 'ddt';

ALTER TABLE collectivite
  DROP CONSTRAINT IF EXISTS collectivite_type_check;

ALTER TABLE collectivite
  ADD CONSTRAINT collectivite_type_check
    CHECK (type IN ('epci', 'commune', 'region', 'departement', 'test', 'prefecture_region', 'prefecture_departement', 'service_public', 'structure_sans_statut_juridique', 'dreal'));

COMMIT;
