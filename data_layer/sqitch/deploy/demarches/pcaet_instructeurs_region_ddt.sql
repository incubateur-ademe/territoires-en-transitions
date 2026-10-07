-- Deploy tet:demarches/pcaet_instructeurs_region_ddt to pg

BEGIN;

-- ===========================================================================
-- Deux cercles, désormais distincts.
--
-- Être *destinataire* d'une transmission et être *saisi pour avis* n'étaient
-- qu'une seule et même chose tant que la DREAL était seule instructrice. La
-- région et la DDT reçoivent le dossier en lecture : elles ont une demande
-- d'avis, mais aucun avis ne peut en émaner.
--
-- La liste permise devient donc un argument du trigger, au lieu d'être écrite
-- en dur dans la fonction — les deux triggers partagent le même contrôle avec
-- des périmètres différents.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.demarche_pcaet_check_collectivite_est_instructeur() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    cible_id     integer;
    cible_type   text;
    types_permis text[];
BEGIN
    cible_id := (to_jsonb(NEW) ->> TG_ARGV[0])::integer;
    types_permis := string_to_array(TG_ARGV[1], ',');

    SELECT type INTO cible_type FROM public.collectivite WHERE id = cible_id;

    IF cible_type IS NULL OR NOT (cible_type = ANY (types_permis)) THEN
        RAISE EXCEPTION
            'La collectivité % n''est pas d''un type autorisé ici (type : %, attendus : %)',
            cible_id, COALESCE(cible_type, 'introuvable'), TG_ARGV[1];
    END IF;

    RETURN NEW;
END;
$$;

-- Destinataires d'une transmission : la DREAL de la région, le conseil régional
-- de la région, la DDT du département.
DROP TRIGGER IF EXISTS check_instructeur ON public.demarche_pcaet_demande_avis;
CREATE TRIGGER check_instructeur
    BEFORE INSERT OR UPDATE ON public.demarche_pcaet_demande_avis
    FOR EACH ROW
    EXECUTE FUNCTION public.demarche_pcaet_check_collectivite_est_instructeur(
        'instructeur_collectivite_id', 'dreal,region,ddt');

-- Émetteurs d'un avis : la DREAL seule, qui porte les deux titres attendus.
DROP TRIGGER IF EXISTS check_emetteur ON public.demarche_pcaet_avis;
CREATE TRIGGER check_emetteur
    BEFORE INSERT OR UPDATE ON public.demarche_pcaet_avis
    FOR EACH ROW
    EXECUTE FUNCTION public.demarche_pcaet_check_collectivite_est_instructeur(
        'emetteur_collectivite_id', 'dreal');

COMMENT ON COLUMN public.demarche_pcaet_demande_avis.instructeur_collectivite_id IS
    'La collectivité destinataire de la transmission — DREAL, conseil régional ou DDT (trigger). Seule la DREAL est saisie pour avis ; les deux autres reçoivent le dossier en lecture.';

COMMIT;
