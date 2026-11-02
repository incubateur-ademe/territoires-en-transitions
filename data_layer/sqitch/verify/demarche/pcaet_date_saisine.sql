-- Verify tet:demarche/pcaet_date_saisine on pg

BEGIN;

DO $$
BEGIN
  ASSERT (
    SELECT COUNT(*) = 1
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = 'demarche_pcaet_date_saisine'
  ), 'La table demarche_pcaet_date_saisine doit exister';

  ASSERT (
    SELECT relrowsecurity
    FROM pg_class
    WHERE oid = 'public.demarche_pcaet_date_saisine'::regclass
  ), 'Le RLS doit être activé (non-exposition REST)';

  ASSERT (
    SELECT confdeltype = 'c'
    FROM pg_constraint
    WHERE conrelid = 'public.demarche_pcaet_date_saisine'::regclass
      AND contype = 'f'
      AND confrelid = 'public.demarche'::regclass
  ), 'La FK date de saisine → démarche doit exister, en ON DELETE CASCADE';
END $$;

ROLLBACK;
