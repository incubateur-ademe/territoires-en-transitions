-- Revert tet:demarches/pcaet_avis_president_region from pg

BEGIN;

-- Les avis au titre du président de région n'ont plus de titre permis : ils
-- disparaissent avec la contrainte qui les autorisait.
DELETE FROM public.demarche_pcaet_avis WHERE au_titre_de = 'president_region';

ALTER TABLE public.demarche_pcaet_avis
    DROP CONSTRAINT demarche_pcaet_avis_au_titre_de_check;

ALTER TABLE public.demarche_pcaet_avis
    ADD CONSTRAINT demarche_pcaet_avis_au_titre_de_check
    CHECK (au_titre_de IN ('prefet_region', 'autorite_environnementale'));

DROP TRIGGER IF EXISTS check_emetteur ON public.demarche_pcaet_avis;
CREATE TRIGGER check_emetteur
    BEFORE INSERT OR UPDATE ON public.demarche_pcaet_avis
    FOR EACH ROW
    EXECUTE FUNCTION public.demarche_pcaet_check_collectivite_est_instructeur(
        'emetteur_collectivite_id', 'dreal');

COMMENT ON COLUMN public.demarche_pcaet_avis.au_titre_de IS
    'prefet_region | autorite_environnementale — la DREAL peut porter les deux titres.';

COMMIT;
