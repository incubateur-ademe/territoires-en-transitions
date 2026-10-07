-- Revert tet:demarches/pcaet_instructeurs_region_ddt from pg

BEGIN;

-- Les demandes adressées aux nouveaux destinataires n'ont plus de type permis :
-- elles partent avec la règle qui les autorisait.
DELETE FROM public.demarche_pcaet_demande_avis
WHERE instructeur_collectivite_id IN (
    SELECT id FROM public.collectivite WHERE type IN ('region', 'ddt')
);

CREATE OR REPLACE FUNCTION public.demarche_pcaet_check_collectivite_est_instructeur() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    cible_id   integer;
    cible_type text;
BEGIN
    cible_id := (to_jsonb(NEW) ->> TG_ARGV[0])::integer;
    SELECT type INTO cible_type FROM public.collectivite WHERE id = cible_id;
    IF cible_type IS NULL OR cible_type NOT IN ('dreal') THEN
        RAISE EXCEPTION 'La collectivité % n''est pas d''un type instructeur (type : %)',
            cible_id, COALESCE(cible_type, 'introuvable');
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_instructeur ON public.demarche_pcaet_demande_avis;
CREATE TRIGGER check_instructeur
    BEFORE INSERT OR UPDATE ON public.demarche_pcaet_demande_avis
    FOR EACH ROW
    EXECUTE FUNCTION public.demarche_pcaet_check_collectivite_est_instructeur('instructeur_collectivite_id');

DROP TRIGGER IF EXISTS check_emetteur ON public.demarche_pcaet_avis;
CREATE TRIGGER check_emetteur
    BEFORE INSERT OR UPDATE ON public.demarche_pcaet_avis
    FOR EACH ROW
    EXECUTE FUNCTION public.demarche_pcaet_check_collectivite_est_instructeur('emetteur_collectivite_id');

COMMIT;
