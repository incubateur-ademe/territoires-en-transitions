-- Verify tet:referentiel/audit_preuves_archive_audit_optionnel on pg

BEGIN;

SELECT 1 / (CASE WHEN is_nullable = 'YES' THEN 1 ELSE 0 END)
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'audit_preuves_archive'
  AND column_name = 'audit_id';

ROLLBACK;
