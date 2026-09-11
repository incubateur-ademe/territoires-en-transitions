-- Revert tet:collectivite/service_etat_acces_restreint from pg

BEGIN;

DROP TRIGGER IF EXISTS collectivite_service_deconcentre_est_restreint ON public.collectivite;
DROP FUNCTION IF EXISTS public.collectivite_service_deconcentre_est_restreint();

-- Les services rouvrent : c'est bien l'état d'avant le change, aussi ouvert
-- fût-il. Une collectivité restreinte pour une autre raison garde son flag,
-- puisque le filtre porte sur le type.
UPDATE public.collectivite
SET access_restreint = false
WHERE type IN ('dreal', 'ddt', 'dr_ademe', 'service_national');

COMMIT;
