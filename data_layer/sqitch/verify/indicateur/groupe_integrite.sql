-- Verify tet:indicateur/groupe_integrite on pg

BEGIN;

SELECT 1 / count(*)
FROM pg_constraint
WHERE conrelid = 'public.indicateur_groupe'::regclass
  AND conname = 'indicateur_groupe_enfant_unique'
  AND contype = 'u';

SELECT 1 / count(*)
FROM pg_constraint
WHERE conrelid = 'public.indicateur_groupe'::regclass
  AND conname = 'indicateur_groupe_parent_distinct_enfant'
  AND contype = 'c';

SELECT 1 / count(*)
FROM pg_trigger
WHERE tgrelid = 'public.indicateur_groupe'::regclass
  AND tgname = 'verifier_collectivite_groupe_indicateur'
  AND NOT tgisinternal;

ROLLBACK;
