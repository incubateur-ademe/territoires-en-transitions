-- Deploy tet:plan_action/fiches to pg

BEGIN;

CREATE OR REPLACE FUNCTION public.fiche_action_service_tag(public.fiches_action)
    RETURNS SETOF public.fiche_action_service_tag
    LANGUAGE SQL
    STABLE
    SECURITY DEFINER
    SET search_path TO ''
BEGIN ATOMIC
    SELECT *
    FROM public.fiche_action_service_tag
    WHERE fiche_id = $1.id
    ;
END;

CREATE OR REPLACE FUNCTION public.fiche_action_structure_tag(public.fiches_action)
    RETURNS SETOF public.fiche_action_structure_tag
    LANGUAGE SQL
    STABLE
    SECURITY DEFINER
    SET search_path TO ''
BEGIN ATOMIC
    SELECT *
    FROM public.fiche_action_structure_tag
    WHERE fiche_id = $1.id
    ;
END;

CREATE OR REPLACE FUNCTION public.fiche_action_personne_tag(public.fiches_action)
    RETURNS SETOF public.fiche_action_pilote
    LANGUAGE SQL
    STABLE
    SECURITY DEFINER
    SET search_path TO ''
BEGIN ATOMIC
    SELECT *
    FROM public.fiche_action_pilote
    WHERE fiche_id = $1.id
    ;
END;


CREATE OR REPLACE FUNCTION public.fiche_action_pilote(public.fiches_action)
    RETURNS SETOF public.fiche_action_pilote
    LANGUAGE SQL
    STABLE
    SECURITY DEFINER
    SET search_path TO ''
BEGIN ATOMIC
    SELECT *
    FROM public.fiche_action_pilote
    WHERE fiche_id = $1.id
    ;
END;

CREATE OR REPLACE FUNCTION public.fiche_action_axe(public.fiches_action)
    RETURNS SETOF public.axe
    LANGUAGE SQL
    STABLE
    SECURITY DEFINER
    SET search_path TO ''
BEGIN ATOMIC
    SELECT axe.*
    FROM public.fiche_action_axe
    JOIN public.axe ON fiche_action_axe.axe_id = axe.id
    WHERE fiche_action_axe.fiche_id = $1.id
    ;
END;

COMMIT;
