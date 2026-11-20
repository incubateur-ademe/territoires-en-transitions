-- Revert tet:utilisateur/invitation_email_pending_index from pg

BEGIN;

DROP INDEX IF EXISTS utilisateur.invitation_email_pending_idx;

COMMIT;
