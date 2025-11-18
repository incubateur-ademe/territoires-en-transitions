-- Verify tet:referentiel/add_audit_etoiles on pg

BEGIN;

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'score_snapshot'
  AND column_name = 'etoiles';

ROLLBACK;
