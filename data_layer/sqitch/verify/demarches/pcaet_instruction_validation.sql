-- Verify tet:demarches/pcaet_instruction_validation on pg

BEGIN;

DO $$
BEGIN
  ASSERT (
    SELECT COUNT(*) = 1
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = 'demarche_pcaet_instruction_validation'
  ), 'La table demarche_pcaet_instruction_validation doit exister';

  ASSERT (
    SELECT relrowsecurity
    FROM pg_class
    WHERE oid = 'public.demarche_pcaet_instruction_validation'::regclass
  ), 'Le RLS doit être activé (non-exposition REST)';

  ASSERT (
    SELECT COUNT(*) = 0
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'demarche_pcaet_instruction_validation'
  ), 'Aucune policy ne doit exposer la table';

  ASSERT (
    SELECT COUNT(*) = 1
    FROM pg_constraint
    WHERE conrelid = 'public.demarche_pcaet_instruction_validation'::regclass
      AND contype = 'u'
      AND conname = 'demarche_pcaet_instruction_validation_unique_partie'
  ), 'L''unicité « une validation par (demande, partie) » doit exister';

  ASSERT (
    SELECT confdeltype = 'c'
    FROM pg_constraint
    WHERE conrelid = 'public.demarche_pcaet_instruction_validation'::regclass
      AND contype = 'f'
      AND confrelid = 'public.demarche_pcaet_demande_avis'::regclass
  ), 'La FK validation → demande doit exister, en ON DELETE CASCADE';
END $$;

ROLLBACK;
