-- Revert tet:plan_action/fiche_secteur_origine_import_ia from pg

BEGIN;

-- Les secteurs proposes par l import IA redeviennent a demander a Communs.
DELETE FROM public.fiche_action_secteur_attribution WHERE origine = 'import_ia';

ALTER TABLE public.fiche_action_secteur_attribution
    DROP COLUMN IF EXISTS justification,
    DROP CONSTRAINT fiche_action_secteur_attribution_origine_check,
    ADD CONSTRAINT fiche_action_secteur_attribution_origine_check
        CHECK (origine IN ('automatique', 'manuelle', 'indisponible'));

COMMIT;
