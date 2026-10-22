-- Verify tet:demarches/pcaet_referent on pg

BEGIN;

DO $$
BEGIN
  ASSERT (
    SELECT COUNT(*) = 1
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = 'demarche_pcaet_referent'
  ), 'La table demarche_pcaet_referent doit exister';

  ASSERT (
    SELECT relrowsecurity
    FROM pg_class
    WHERE oid = 'public.demarche_pcaet_referent'::regclass
  ), 'Le RLS doit être activé (non-exposition REST)';

  ASSERT (
    SELECT COUNT(*) = 0
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'demarche_pcaet_referent'
  ), 'Aucune policy ne doit exposer la table';

  ASSERT (
    SELECT COUNT(*) = 1
    FROM pg_constraint
    WHERE conrelid = 'public.demarche_pcaet_referent'::regclass
      AND contype = 'c'
      AND conname = 'demarche_pcaet_referent_membre_ou_contact'
  ), 'Un référent doit être soit un membre, soit un contact libre';

  ASSERT (
    SELECT COUNT(*) = 2
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'demarche_pcaet_referent'
      AND indexname IN (
        'demarche_pcaet_referent_unique_membre',
        'demarche_pcaet_referent_unique_contact'
      )
  ), 'Les unicités par organisme (membre, e-mail) doivent exister';

  ASSERT (
    SELECT confdeltype = 'c'
    FROM pg_constraint
    WHERE conrelid = 'public.demarche_pcaet_referent'::regclass
      AND contype = 'f'
      AND confrelid = 'public.collectivite'::regclass
  ), 'La FK référent → organisme doit exister, en ON DELETE CASCADE';
END $$;

ROLLBACK;
