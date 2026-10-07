-- Verify tet:demarches/pcaet_destinataires_dr_ademe_service_national on pg

BEGIN;

DO $$
BEGIN
  ASSERT (
    SELECT pg_get_triggerdef(oid) LIKE '%dreal,region,ddt,dr_ademe,service_national%'
    FROM pg_trigger
    WHERE tgname = 'check_instructeur'
      AND tgrelid = 'public.demarche_pcaet_demande_avis'::regclass
  ), 'check_instructeur doit accepter la DR ADEME et les services nationaux en plus des trois premiers destinataires';

  ASSERT (
    SELECT pg_get_triggerdef(oid) NOT LIKE '%dr_ademe%'
       AND pg_get_triggerdef(oid) NOT LIKE '%service_national%'
    FROM pg_trigger
    WHERE tgname = 'check_emetteur'
      AND tgrelid = 'public.demarche_pcaet_avis'::regclass
  ), 'check_emetteur doit rester fermé aux destinataires en lecture';
END $$;

ROLLBACK;
