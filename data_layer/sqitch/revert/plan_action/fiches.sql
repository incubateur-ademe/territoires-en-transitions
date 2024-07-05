-- Deploy tet:plan_action/fiches to pg

BEGIN;

DROP INDEX IF EXISTS fiche_action_collectivite_id_idx;
DROP INDEX IF EXISTS fiche_action_collectivite_id_modified_at_idx;
DROP INDEX IF EXISTS fiche_action_lien_fiche_une_idx;
DROP INDEX IF EXISTS fiche_action_lien_fiche_deux_idx;
DROP INDEX IF EXISTS fiche_action_service_tag_service_tag_id_idx;
DROP INDEX IF EXISTS fiche_action_structure_tag_structure_tag_id_idx;
DROP INDEX IF EXISTS fiche_action_partenaire_tag_partenaire_tag_id_idx;


DROP FUNCTION IF EXISTS fiche_action_pilote_dcp(public.fiche_action_pilote);


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
