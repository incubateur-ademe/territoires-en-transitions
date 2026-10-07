-- Deploy tet:demarches/pcaet_avis_president_region to pg
-- requires: demarches/pcaet_instructeurs_region_ddt

BEGIN;

-- ===========================================================================
-- Le troisième avis attendu par le code de l'environnement.
--
-- Trois avis, pas deux : l'autorité environnementale (art. R.122-21), le
-- président de région et le préfet de région (art. R.229-54). La DREAL porte
-- les deux titres de l'État ; celui du président de région revient au conseil
-- régional, qui devient donc émetteur au même titre qu'elle.
--
-- En pratique un seul document peut porter les trois avis : ce sont trois
-- lignes, la même pièce pouvant être référencée par chacune.
-- ===========================================================================
ALTER TABLE public.demarche_pcaet_avis
    DROP CONSTRAINT demarche_pcaet_avis_au_titre_de_check;

ALTER TABLE public.demarche_pcaet_avis
    ADD CONSTRAINT demarche_pcaet_avis_au_titre_de_check
    CHECK (au_titre_de IN ('prefet_region', 'autorite_environnementale', 'president_region'));

-- Émetteurs d'un avis : la DREAL pour les deux titres de l'État, le conseil
-- régional pour celui de son président. La DDT reste destinataire en lecture.
DROP TRIGGER IF EXISTS check_emetteur ON public.demarche_pcaet_avis;
CREATE TRIGGER check_emetteur
    BEFORE INSERT OR UPDATE ON public.demarche_pcaet_avis
    FOR EACH ROW
    EXECUTE FUNCTION public.demarche_pcaet_check_collectivite_est_instructeur(
        'emetteur_collectivite_id', 'dreal,region');

COMMENT ON COLUMN public.demarche_pcaet_avis.au_titre_de IS
    'prefet_region | autorite_environnementale | president_region — la DREAL porte les deux premiers, le conseil régional le troisième.';

COMMENT ON TABLE public.demarche_pcaet_avis IS
    'Avis d''un service instructeur sur une démarche : sens + pièce jointe. Un avis par « au titre de », soit 0 à 3 par démarche, la même PJ pouvant être partagée. L''absence d''avis est un état normal.';

COMMENT ON COLUMN public.demarche_pcaet_demande_avis.instructeur_collectivite_id IS
    'La collectivité destinataire de la transmission — DREAL, conseil régional ou DDT (trigger). La DREAL et le conseil régional sont saisis pour avis, la DDT reçoit le dossier en lecture.';

COMMIT;
