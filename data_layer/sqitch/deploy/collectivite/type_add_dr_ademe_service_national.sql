-- Deploy tet:collectivite/type_add_dr_ademe_service_national to pg
-- requires: collectivite/type_add_ddt

BEGIN;

ALTER TABLE collectivite
  DROP CONSTRAINT IF EXISTS collectivite_type_check;

ALTER TABLE collectivite
  ADD CONSTRAINT collectivite_type_check
    CHECK (type IN ('epci', 'commune', 'region', 'departement', 'test', 'prefecture_region', 'prefecture_departement', 'service_public', 'structure_sans_statut_juridique', 'dreal', 'ddt', 'dr_ademe', 'service_national'));

-- Une DR ADEME par région, comme une DREAL : c'est le code géographique qui
-- identifie le service, pas son nom.
CREATE UNIQUE INDEX IF NOT EXISTS collectivite_dr_ademe_unique_region_code
  ON collectivite (type, region_code)
  WHERE type = 'dr_ademe';

-- `service_national` est une famille, pas un service : la DGEC aujourd'hui,
-- l'ADEME nationale et d'autres ensuite. Rien à y rendre unique — c'est le
-- défaut de code géographique qui fait le périmètre national.
ALTER TABLE collectivite
  DROP CONSTRAINT IF EXISTS collectivite_service_national_sans_code_geographique;

ALTER TABLE collectivite
  ADD CONSTRAINT collectivite_service_national_sans_code_geographique
    CHECK (type <> 'service_national' OR (region_code IS NULL AND departement_code IS NULL));

COMMIT;
