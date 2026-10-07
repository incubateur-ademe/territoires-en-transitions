-- Verify tet:utilisateur/dcp_email_lower_index on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT pg_get_indexdef(c.oid) LIKE '%lower(email)%'
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = 'dcp_email_lower_idx'
    ), 'L''index dcp_email_lower_idx doit porter sur lower(email)';
END $$;

ROLLBACK;
