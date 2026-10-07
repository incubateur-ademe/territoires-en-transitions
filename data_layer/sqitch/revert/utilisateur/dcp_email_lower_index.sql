-- Revert tet:utilisateur/dcp_email_lower_index from pg

BEGIN;

DROP INDEX IF EXISTS public.dcp_email_lower_idx;

COMMIT;
