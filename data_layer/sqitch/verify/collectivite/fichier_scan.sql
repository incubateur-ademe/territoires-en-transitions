-- Verify tet:collectivite/fichier_scan on pg

BEGIN;

SELECT id, bucket_id, object_name, status, signature, engine_version,
       attempts, scanned_at, deleted_at
FROM public.collectivite_fichier_scan
WHERE false;

DO $$
BEGIN
  ASSERT (
    SELECT relrowsecurity
    FROM pg_class
    WHERE oid = 'public.collectivite_fichier_scan'::regclass
  ), 'Le RLS doit être activé (non-exposition REST)';

  ASSERT (
    SELECT COUNT(*) = 0
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'collectivite_fichier_scan'
  ), 'Aucune policy ne doit exposer la table';
END $$;

ROLLBACK;
