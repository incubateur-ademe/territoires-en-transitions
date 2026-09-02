-- Revert tet:demarches/pcaet_destinataires_dr_ademe_service_national from pg

BEGIN;

-- Les demandes adressées aux nouveaux destinataires n'ont plus de type permis :
-- elles partent avec la règle qui les autorisait.
DELETE FROM public.demarche_pcaet_demande_avis
WHERE instructeur_collectivite_id IN (
    SELECT id FROM public.collectivite WHERE type IN ('dr_ademe', 'service_national')
);

DROP TRIGGER IF EXISTS check_instructeur ON public.demarche_pcaet_demande_avis;
CREATE TRIGGER check_instructeur
    BEFORE INSERT OR UPDATE ON public.demarche_pcaet_demande_avis
    FOR EACH ROW
    EXECUTE FUNCTION public.demarche_pcaet_check_collectivite_est_instructeur(
        'instructeur_collectivite_id', 'dreal,region,ddt');

COMMENT ON COLUMN public.demarche_pcaet_demande_avis.instructeur_collectivite_id IS
    'La collectivité destinataire de la transmission — DREAL, conseil régional ou DDT (trigger). La DREAL et le conseil régional sont saisis pour avis, la DDT reçoit le dossier en lecture.';

COMMIT;
