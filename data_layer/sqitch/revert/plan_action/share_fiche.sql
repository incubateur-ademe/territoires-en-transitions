-- Revert territoires-en-transitions:plan_action/share_fiche from pg

BEGIN;

-- Drop the table
DROP TABLE IF EXISTS fiche_action_sharing;

COMMIT;
