-- Revert tet:demarche/pcaet_supra_plusieurs_depots_en_cours from pg

-- Échoue tant qu'un Supra a plusieurs dépôts en cours : en archiver d'abord.

BEGIN;

CREATE UNIQUE INDEX demarche_active_unique
    ON public.demarche (collectivite_id, type)
    WHERE status IN ('en_elaboration', 'transmis_pour_avis',
                     'instruit_hors_plateforme');

COMMIT;
