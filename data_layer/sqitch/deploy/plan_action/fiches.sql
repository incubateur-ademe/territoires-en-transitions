-- Deploy tet:plan_action/fiches to pg

BEGIN;

-- Recrée la fonction de relation calculée pour prendre en compte les modifications de la table fiche_action_axe

CREATE OR REPLACE FUNCTION public.fiche_action_plan(public.fiche_action)
    RETURNS SETOF public.axe
    LANGUAGE SQL
    STABLE
    SECURITY DEFINER
    SET search_path TO ''
BEGIN ATOMIC
    SELECT plan.*
    FROM public.fiche_action_axe
    JOIN public.axe ON fiche_action_axe.axe_id = axe.id
    JOIN public.axe AS plan ON axe.plan = plan.id
    WHERE fiche_action_axe.fiche_id = $1.id
    ;
END;

COMMIT;

