-- Verify tet:referentiel/add_demande_associated_collectivite_id on pg

BEGIN;

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'labellisation'
  AND table_name = 'demande'
  AND column_name = 'associated_collectivite_id';

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'labellisation'
  AND column_name = 'audit_id';

ROLLBACK;
