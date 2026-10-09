-- Deploy tet:plan_action/fiche_secteur_origine_import_ia to pg
-- requires: plan_action/fiche_action_secteur_attribution

BEGIN;

ALTER TABLE public.fiche_action_secteur_attribution
    DROP CONSTRAINT fiche_action_secteur_attribution_origine_check,
    ADD CONSTRAINT fiche_action_secteur_attribution_origine_check
        CHECK (origine IN ('automatique', 'manuelle', 'indisponible', 'import_ia')),
    ADD COLUMN justification text NULL;

COMMENT ON COLUMN public.fiche_action_secteur_attribution.origine IS
  'automatique : propose par Communs ; manuelle : saisi par la collectivite, jamais ecrase ; indisponible : fiche inconnue de Communs (404), a renseigner ; import_ia : propose par l import IA du plan, a partir du document source, et jamais redemande a Communs.';

COMMENT ON COLUMN public.fiche_action_secteur_attribution.justification IS
  'Raison donnee par l import IA pour les secteurs retenus ; nulle pour les autres origines.';

COMMIT;
