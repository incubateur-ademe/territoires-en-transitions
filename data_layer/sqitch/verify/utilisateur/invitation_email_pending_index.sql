-- Verify tet:utilisateur/invitation_email_pending_index on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT pg_get_indexdef(c.oid) LIKE '%lower(email)%'
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'utilisateur'
          AND c.relname = 'invitation_email_pending_idx'
    ), 'L''index invitation_email_pending_idx doit porter sur lower(email)';
END $$;

ROLLBACK;
