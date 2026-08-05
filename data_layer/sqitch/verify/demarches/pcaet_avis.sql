-- Verify tet:demarches/pcaet_avis on pg

BEGIN;

DO $$
BEGIN
  ASSERT (
    SELECT COUNT(*) = 2
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN ('pcaet_demande_avis', 'pcaet_avis')
  ), 'Les deux tables du module avis PCAET doivent exister';

  ASSERT (
    SELECT COUNT(*) = 0
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename = 'pcaet_depot'
  ), 'La table pcaet_depot ne doit plus exister (lecture directe)';

  ASSERT (
    SELECT bool_and(relrowsecurity)
    FROM pg_class
    WHERE oid IN ('public.pcaet_demande_avis'::regclass,
                  'public.pcaet_avis'::regclass)
  ), 'Le RLS doit être activé sur les deux tables (non-exposition REST)';

  ASSERT (
    SELECT COUNT(*) = 0
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('pcaet_demande_avis', 'pcaet_avis')
  ), 'Aucune policy ne doit exposer les tables du module';

  ASSERT (
    SELECT COUNT(*) = 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'pcaet_check_collectivite_est_instructeur'
  ), 'La fonction d''invariant instructeur doit exister';

  ASSERT (
    SELECT COUNT(*) = 2
    FROM pg_trigger
    WHERE tgname IN ('check_instructeur', 'check_emetteur')
      AND tgrelid IN ('public.pcaet_demande_avis'::regclass, 'public.pcaet_avis'::regclass)
  ), 'Les deux triggers d''invariant doivent exister';

  ASSERT (
    SELECT COUNT(*) = 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'pcaet_demande_avis'
      AND indexname = 'pcaet_demande_avis_instructeur'
  ), 'L''index du tableau de bord (instructrice) doit exister';

  ASSERT (
    SELECT confdeltype = 'r'
    FROM pg_constraint
    WHERE conrelid = 'public.pcaet_demande_avis'::regclass
      AND contype = 'f'
      AND confrelid = 'public.demarche'::regclass
  ), 'La FK demande → démarche doit exister, en ON DELETE RESTRICT';

  ASSERT (
    SELECT COUNT(*) = 1
    FROM pg_constraint
    WHERE conrelid = 'public.pcaet_demande_avis'::regclass
      AND contype = 'u'
      AND conname = 'pcaet_demande_avis_unique_demarche_instructeur'
  ), 'L''unicité « une demande par (démarche, instructrice) » doit exister';
END $$;

ROLLBACK;
