-- Verify tet:collectivite/dreal_unique_region_code on pg

BEGIN;

DO $$
BEGIN
  ASSERT (
    SELECT indexdef ILIKE '%CREATE UNIQUE INDEX%'
      AND indexdef ILIKE '%region_code%'
      AND indexdef ILIKE '%dreal%'
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'collectivite'
      AND indexname = 'collectivite_dreal_unique_region_code'
  ), 'L''index unique partiel (type, region_code) des DREAL doit exister';
END $$;

ROLLBACK;
