-- Deploy tet:collectivite/service_etat_acces_restreint to pg
-- requires: collectivite/service_etat_import

-- Un service déconcentré n'est pas une collectivité visitable.
--
-- Une DREAL, une DDT, une DR ADEME, un service national sont des lignes
-- `collectivite` comme les autres, et naissaient donc `access_restreint =
-- false` : le « mode visite » y donnait à tout compte vérifié de la plateforme
-- la lecture des membres et des documents. Or ce que ces lignes portent, ce
-- n'est pas un territoire — c'est l'annuaire nominatif des correspondants de
-- l'État et les rapports d'avis qu'ils déposent.
--
-- Le flag est **forcé**, pas exigé. Un `CHECK` obligerait chaque chemin
-- d'insertion à le poser — le générateur du seed, les fixtures de test, le
-- back-office — et le premier oubli rouvrirait la porte en silence. Le trigger
-- ferme l'invariant à la source : quel que soit l'écrivain, un service
-- déconcentré est restreint.
--
-- La liste des types est celle de `servicesDeconcentresTypes`
-- (`packages/domain/src/collectivites/service-deconcentre.rules.ts`), et
-- surtout **pas** celle de `isTypeInstructeur` : un conseil régional instruit
-- les dossiers de sa région tout en restant une collectivité de plein exercice,
-- avec ses plans, ses référentiels et son espace public. Le restreindre lui
-- ferait perdre tout cela.

BEGIN;

CREATE OR REPLACE FUNCTION public.collectivite_service_deconcentre_est_restreint()
    RETURNS trigger
    LANGUAGE plpgsql
AS $$
BEGIN
    IF new.type IN ('dreal', 'ddt', 'dr_ademe', 'service_national') THEN
        new.access_restreint = true;
    END IF;

    RETURN new;
END;
$$;

COMMENT ON FUNCTION public.collectivite_service_deconcentre_est_restreint() IS
    'Force access_restreint sur les services déconcentrés (DREAL, DDT, DR ADEME, service national) : leur annuaire de correspondants et leurs rapports d''avis ne relèvent pas du mode visite. Ne concerne pas le conseil régional, instructeur mais collectivité de plein exercice.';

CREATE TRIGGER collectivite_service_deconcentre_est_restreint
    BEFORE INSERT OR UPDATE OF type, access_restreint
    ON public.collectivite
    FOR EACH ROW
EXECUTE FUNCTION public.collectivite_service_deconcentre_est_restreint();

-- Les services déjà en base — 129 à ce jour, posés par
-- `collectivite/service_etat_import` — sont tous ouverts. Le trigger ne les
-- rattraperait qu'à leur prochaine écriture.
UPDATE public.collectivite
SET access_restreint = true
WHERE type IN ('dreal', 'ddt', 'dr_ademe', 'service_national')
  AND access_restreint IS DISTINCT FROM true;

COMMIT;
