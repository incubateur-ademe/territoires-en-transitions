-- Revert tet:plan_action/references_programme_sources from pg

BEGIN;
SET LOCAL lock_timeout = '5s';

-- Bloquer les écritures pendant le contrôle préalable au retrait des colonnes.
LOCK TABLE public.axe, public.fiche_action IN ACCESS EXCLUSIVE MODE;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.axe
        WHERE reference_programme IS NOT NULL OR reference_code IS NOT NULL
            OR engagements_codes IS NOT NULL OR indicateur_source_metadonnee_id IS NOT NULL
    ) OR EXISTS (
        SELECT 1 FROM public.fiche_action
        WHERE reference_programme IS NOT NULL OR reference_kind IS NOT NULL
            OR reference_code IS NOT NULL OR reference_parent_code IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Retour arrière refusé : des références ou sources de plans sont déjà attribuées';
    END IF;
END;
$$;

DROP TRIGGER fiche_action_protect_reference_fields ON public.fiche_action;
DROP TRIGGER axe_protect_reference_fields ON public.axe;
DROP FUNCTION private.protect_plan_reference_fields();

ALTER TABLE public.fiche_action
    DROP COLUMN reference_programme,
    DROP COLUMN reference_kind,
    DROP COLUMN reference_code,
    DROP COLUMN reference_parent_code;

ALTER TABLE public.axe
    DROP COLUMN reference_programme,
    DROP COLUMN reference_code,
    DROP COLUMN engagements_codes,
    DROP COLUMN indicateur_source_metadonnee_id;

DROP FUNCTION private.are_plan_reference_codes_valid(text[]);

COMMIT;
