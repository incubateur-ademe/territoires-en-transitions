-- Revert tet:collectivite/type_add_dreal from pg

BEGIN;

DELETE FROM private_utilisateur_droit
WHERE collectivite_id IN (SELECT id FROM collectivite WHERE type = 'dreal');

DELETE FROM private_collectivite_membre
WHERE collectivite_id IN (SELECT id FROM collectivite WHERE type = 'dreal');

DELETE FROM collectivite_bucket
WHERE collectivite_id IN (SELECT id FROM collectivite WHERE type = 'dreal');

DELETE FROM collectivite WHERE type = 'dreal';

ALTER TABLE collectivite
  DROP CONSTRAINT IF EXISTS collectivite_type_check;

ALTER TABLE collectivite
  ADD CONSTRAINT collectivite_type_check
    CHECK (type IN ('epci', 'commune', 'region', 'departement', 'test', 'prefecture_region', 'prefecture_departement', 'service_public', 'structure_sans_statut_juridique'));

COMMIT;
