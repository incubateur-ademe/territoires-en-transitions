-- Deploy tet:demarches/pcaet_destinataires_dr_ademe_service_national to pg
-- requires: demarches/pcaet_avis_president_region
-- requires: collectivite/type_add_dr_ademe_service_national

BEGIN;

-- Deux familles de plus autour de la table, toutes deux en lecture : la DR
-- ADEME sur sa région, les services nationaux sur le pays entier. Les émetteurs
-- d'avis ne bougent pas — c'est l'intérêt d'avoir séparé les deux cercles.
DROP TRIGGER IF EXISTS check_instructeur ON public.demarche_pcaet_demande_avis;
CREATE TRIGGER check_instructeur
    BEFORE INSERT OR UPDATE ON public.demarche_pcaet_demande_avis
    FOR EACH ROW
    EXECUTE FUNCTION public.demarche_pcaet_check_collectivite_est_instructeur(
        'instructeur_collectivite_id', 'dreal,region,ddt,dr_ademe,service_national');

COMMENT ON COLUMN public.demarche_pcaet_demande_avis.instructeur_collectivite_id IS
    'La collectivité destinataire de la transmission — DREAL, conseil régional, DDT, DR ADEME ou service national (trigger). Seuls la DREAL et le conseil régional sont saisis pour avis ; les autres reçoivent le dossier en lecture.';

COMMIT;
