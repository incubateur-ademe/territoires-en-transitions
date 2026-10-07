-- Deploy tet:collectivite/dreal_unique_region_code to pg

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS collectivite_dreal_unique_region_code
  ON collectivite (type, region_code)
  WHERE type = 'dreal';

COMMIT;
