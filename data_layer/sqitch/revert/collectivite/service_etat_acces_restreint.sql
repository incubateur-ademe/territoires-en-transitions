-- Revert tet:collectivite/service_etat_acces_restreint from pg

BEGIN;

DROP TRIGGER IF EXISTS collectivite_service_deconcentre_est_restreint ON public.collectivite;
DROP FUNCTION IF EXISTS public.collectivite_service_deconcentre_est_restreint();

-- Le revert retire l'invariant, il ne rouvre aucun accès.
--
-- Rendre les services à `access_restreint = false` restaurerait bien l'état
-- d'avant le change — sauf pour un service qu'un administrateur aurait
-- restreint entre-temps pour une autre raison : le revert le rouvrirait sans
-- que personne l'ait demandé, et le flag n'en garde pas trace. Un revert qui
-- ouvre un accès en silence est le mauvais sens du risque.
--
-- Les services restent donc restreints, et celui qui veut vraiment les rouvrir
-- le fait explicitement, service par service. C'est aussi ce qui rend le
-- couple deploy/revert rejouable sans effet de bord.

COMMIT;
