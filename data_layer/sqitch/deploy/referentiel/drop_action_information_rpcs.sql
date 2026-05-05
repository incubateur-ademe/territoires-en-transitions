-- Deploy tet:referentiel/drop_action_information_rpcs to pg
-- Supprime les RPC exposées pour les champs texte d'action_definition (remplacées côté app).

BEGIN;

DROP FUNCTION IF EXISTS public.action_contexte(id action_id);
DROP FUNCTION IF EXISTS public.action_exemples(id action_id);
DROP FUNCTION IF EXISTS public.action_ressources(id action_id);
DROP FUNCTION IF EXISTS public.action_perimetre_evaluation(id action_id);

COMMIT;
