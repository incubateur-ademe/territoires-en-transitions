-- Revert tet:utils/merge_action_commentaire from pg

BEGIN;

drop function private.merge_action_commentaire;

COMMIT;
