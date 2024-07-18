-- Deploy tet:plan_action/fiches to pg

BEGIN;

-- Supprime la nouvelle relation calculée

DROP FUNCTION IF EXISTS public.fiche_action_plan(public.fiche_action);


-- Recrée les computed fields associées à la collectivité
-- 👇

CREATE OR REPLACE FUNCTION public.collectivite_service_tag(public.collectivite)
    RETURNS SETOF public.service_tag
    LANGUAGE SQL
    STABLE
    SECURITY DEFINER
    SET search_path TO ''
BEGIN ATOMIC
    SELECT *
    FROM public.service_tag
    WHERE collectivite_id = $1.id
    ;
END;

CREATE OR REPLACE FUNCTION public.collectivite_structure_tag(public.collectivite)
    RETURNS SETOF public.structure_tag
    LANGUAGE SQL
    STABLE
    SECURITY DEFINER
    SET search_path TO ''
BEGIN ATOMIC
    SELECT *
    FROM public.structure_tag
    WHERE collectivite_id = $1.id
    ;
END;

CREATE OR REPLACE FUNCTION public.collectivite_personne_tag(public.collectivite)
    RETURNS SETOF public.personne_tag
    LANGUAGE SQL
    STABLE
    SECURITY DEFINER
    SET search_path TO ''
BEGIN ATOMIC
    SELECT *
    FROM public.personne_tag
    WHERE collectivite_id = $1.id
    ;
END;

CREATE OR REPLACE FUNCTION public.collectivite_axe(public.collectivite)
    RETURNS SETOF public.axe
    LANGUAGE SQL
    STABLE
    SECURITY DEFINER
    SET search_path TO ''
BEGIN ATOMIC
    SELECT axe.*
    FROM public.axe
    WHERE collectivite_id = $1.id
    ;
END;

COMMIT;
