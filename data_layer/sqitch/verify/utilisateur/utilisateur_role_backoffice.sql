-- Verify tet:utilisateur/utilisateur_role_backoffice on pg

BEGIN;

SELECT user_id, role, created_at, created_by
FROM public.utilisateur_role_backoffice
WHERE false;

DO $$
BEGIN
    ASSERT EXISTS (
        SELECT 1 FROM pg_index
        WHERE indrelid = 'public.utilisateur_role_backoffice'::regclass AND indisprimary
    ), 'Une attribution ne doit exister qu''une fois';

    ASSERT EXISTS (
        SELECT 1 FROM pg_class
        WHERE oid = 'public.utilisateur_role_backoffice'::regclass AND relrowsecurity
    ), 'La RLS doit être activée';

    ASSERT NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'utilisateur_role_backoffice'
    ), 'Seul le backend doit lire les rôles backoffice';

    ASSERT NOT has_table_privilege('anon', 'public.utilisateur_role_backoffice', 'SELECT,INSERT,UPDATE,DELETE'),
        'Les rôles backoffice ne doivent pas être accessibles au rôle anon';
    ASSERT NOT has_table_privilege('authenticated', 'public.utilisateur_role_backoffice', 'SELECT,INSERT,UPDATE,DELETE'),
        'Les rôles backoffice ne doivent pas être accessibles au rôle authenticated';
END $$;

ROLLBACK;
