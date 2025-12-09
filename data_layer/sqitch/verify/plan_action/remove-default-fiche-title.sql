-- Verify tet:plan_action/remove-default-fiche-title on pg

BEGIN;

SELECT 1/COUNT(*)
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'fiche_action'
  AND column_name = 'titre'
  AND column_default IS NULL;

ROLLBACK;
