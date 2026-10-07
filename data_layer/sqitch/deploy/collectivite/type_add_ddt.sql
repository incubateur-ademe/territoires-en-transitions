-- Deploy tet:collectivite/type_add_ddt to pg

BEGIN;

ALTER TABLE collectivite
  DROP CONSTRAINT IF EXISTS collectivite_type_check;

ALTER TABLE collectivite
  ADD CONSTRAINT collectivite_type_check
    CHECK (type IN ('epci', 'commune', 'region', 'departement', 'test', 'prefecture_region', 'prefecture_departement', 'service_public', 'structure_sans_statut_juridique', 'dreal', 'ddt'));

-- Une DDT par département, comme une DREAL par région : c'est le code
-- géographique qui identifie le service, pas son nom.
CREATE UNIQUE INDEX IF NOT EXISTS collectivite_ddt_unique_departement_code
  ON collectivite (type, departement_code)
  WHERE type = 'ddt';

COMMIT;
