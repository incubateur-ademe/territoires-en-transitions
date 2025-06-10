-- Verify territoires-en-transitions:plan_action/share_fiche on pg

BEGIN;

-- Verify that the table exists
SELECT fiche_id, collectivite_id, created_at
FROM fiche_action_sharing
WHERE FALSE;

-- Verify that indexes exist
SELECT 1/COUNT(*)
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname IN (
    'idx_fiche_action_sharing_fiche_id',
    'idx_fiche_action_sharing_collectivite_id'
)
AND n.nspname = 'public';

ROLLBACK;
