-- Verify tet:referentiel/add_audit_etoiles on pg

BEGIN;

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'labellisation'
  AND table_name = 'audit'
  AND column_name = 'etoiles_validees';

ROLLBACK;
