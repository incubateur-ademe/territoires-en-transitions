BEGIN;
SELECT kind, version, revision, metadata FROM public.electrification_data_selection WHERE false;
DO $$
BEGIN
  ASSERT (SELECT relrowsecurity FROM pg_class
          WHERE oid = 'public.electrification_data_selection'::regclass);
  ASSERT NOT has_table_privilege('anon', 'public.electrification_data_selection', 'INSERT');
  ASSERT NOT has_table_privilege('authenticated', 'public.electrification_data_selection', 'UPDATE');
END $$;
ROLLBACK;
