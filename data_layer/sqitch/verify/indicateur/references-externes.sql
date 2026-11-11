-- Verify tet:indicateur/references-externes on pg
BEGIN;
SELECT source, code_externe, indicateur_id, lien_source, version
FROM public.indicateur_reference_externe WHERE false;
DO $$
BEGIN
    ASSERT (SELECT relrowsecurity FROM pg_class
            WHERE oid = 'public.indicateur_reference_externe'::regclass);
    ASSERT NOT has_table_privilege('anon', 'public.indicateur_reference_externe', 'INSERT');
    ASSERT NOT has_table_privilege('authenticated', 'public.indicateur_reference_externe', 'UPDATE');
END $$;
ROLLBACK;
