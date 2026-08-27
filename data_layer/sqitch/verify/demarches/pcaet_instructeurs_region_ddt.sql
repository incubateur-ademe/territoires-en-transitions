-- Verify tet:demarches/pcaet_instructeurs_region_ddt on pg

BEGIN;

DO $$
BEGIN
  ASSERT (
    SELECT count(*) = 1 FROM pg_trigger
    WHERE tgname = 'check_instructeur'
      AND tgrelid = 'public.demarche_pcaet_demande_avis'::regclass
  ), 'Le trigger check_instructeur doit exister sur demarche_pcaet_demande_avis';

  ASSERT (
    SELECT pg_get_triggerdef(oid) LIKE '%dreal,region,ddt%'
    FROM pg_trigger
    WHERE tgname = 'check_instructeur'
      AND tgrelid = 'public.demarche_pcaet_demande_avis'::regclass
  ), 'check_instructeur doit accepter dreal, region et ddt';

  ASSERT (
    SELECT pg_get_triggerdef(oid) NOT LIKE '%region%'
    FROM pg_trigger
    WHERE tgname = 'check_emetteur'
      AND tgrelid = 'public.demarche_pcaet_avis'::regclass
  ), 'check_emetteur doit rester réservé aux instructeurs déposant un avis';
END $$;

ROLLBACK;
