-- Verify tet:indicateur/indicateur_vue on pg

BEGIN;

SELECT id, collectivite_id, nom, filtres, created_at, modified_at, created_by, modified_by
FROM public.indicateur_vue
WHERE false;

DO $$
DECLARE
    author_column text;
BEGIN
    ASSERT EXISTS (
        SELECT 1 FROM pg_index
        WHERE indrelid = 'public.indicateur_vue'::regclass AND indisprimary
    ), 'La vue doit avoir une clé primaire';

    ASSERT EXISTS (
        SELECT 1 FROM pg_class
        WHERE oid = 'public.indicateur_vue'::regclass AND relrowsecurity
    ), 'La RLS doit être activée';

    ASSERT NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'indicateur_vue'
    ), 'Seul le backend doit accéder aux vues';

    ASSERT NOT has_table_privilege('anon', 'public.indicateur_vue', 'SELECT,INSERT,UPDATE,DELETE'),
        'Les vues ne doivent pas être accessibles au rôle anon';
    ASSERT NOT has_table_privilege('authenticated', 'public.indicateur_vue', 'SELECT,INSERT,UPDATE,DELETE'),
        'Les vues ne doivent pas être directement accessibles au rôle authenticated';

    FOREACH author_column IN ARRAY ARRAY['created_by', 'modified_by'] LOOP
        ASSERT EXISTS (
            SELECT 1 FROM pg_constraint c
            JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
            WHERE c.conrelid = 'public.indicateur_vue'::regclass
              AND c.contype = 'f'
              AND c.confrelid = 'auth.users'::regclass
              AND c.confdeltype = 'n'
              AND a.attname = author_column
        ), 'Le départ de l''auteur doit préserver les vues';
    END LOOP;

    ASSERT EXISTS (
        SELECT 1 FROM pg_constraint c
        WHERE c.conrelid = 'public.indicateur_vue'::regclass
          AND c.contype = 'f'
          AND c.confrelid = 'public.collectivite'::regclass
          AND c.confdeltype = 'c'
    ), 'Les vues doivent appartenir à leur collectivité';

    ASSERT to_regclass('public.indicateur_vue_collectivite_created_at_id_idx') IS NOT NULL,
        'La liste des vues doit être indexée par collectivité';
END $$;

ROLLBACK;
