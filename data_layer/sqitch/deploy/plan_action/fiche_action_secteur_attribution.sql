-- Deploy tet:plan_action/fiche_action_secteur_attribution to pg
-- requires: plan_action/plan_action

BEGIN;

CREATE TYPE public.secteur_reglementaire AS ENUM (
    'residentiel',
    'tertiaire',
    'transport_routier',
    'autres_transports',
    'agriculture',
    'dechets',
    'industrie_hors_branche_energie',
    'branche_energie'
);

COMMENT ON TYPE public.secteur_reglementaire IS
  'Secteurs reglementaires de l article R. 229-52 du code de l environnement, avec les codes de l API Communs.';

CREATE TABLE public.fiche_action_secteur_attribution
(
    fiche_id        integer                        PRIMARY KEY REFERENCES public.fiche_action (id) ON DELETE CASCADE,
    secteurs        public.secteur_reglementaire[] NOT NULL,
    origine         text                           NOT NULL,
    methode         text,
    reponse_communs jsonb,
    modified_at     timestamptz                    NOT NULL DEFAULT now(),
    modified_by     uuid                           REFERENCES auth.users,
    CONSTRAINT fiche_action_secteur_attribution_origine_check
        CHECK (origine IN ('automatique', 'manuelle', 'indisponible')),
    CONSTRAINT fiche_action_secteur_attribution_indisponible_check
        CHECK (origine <> 'indisponible' OR secteurs = '{}')
);

COMMENT ON TABLE public.fiche_action_secteur_attribution IS
  'Secteurs reglementaires d une fiche, proposes par Communs ou saisis par la collectivite. Une fiche sans ligne n a jamais ete demandee a Communs. La fiche elle-meme n est pas modifiee : pas de webhook, pas de date de modification.';

COMMENT ON COLUMN public.fiche_action_secteur_attribution.secteurs IS
  'Secteurs retenus ; vide si la fiche est non attribuable ou inconnue de Communs.';

COMMENT ON COLUMN public.fiche_action_secteur_attribution.origine IS
  'automatique : propose par Communs ; manuelle : saisi par la collectivite, jamais ecrase ; indisponible : fiche inconnue de Communs (404), a renseigner.';

COMMENT ON COLUMN public.fiche_action_secteur_attribution.methode IS
  'Version de calcul Communs ayant produit les secteurs ; nulle si manuelle.';

COMMENT ON COLUMN public.fiche_action_secteur_attribution.reponse_communs IS
  'Reponse brute de Communs, pour recalculer sans rappeler l API ; nulle si manuelle.';

ALTER TABLE public.fiche_action_secteur_attribution ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.fiche_action_secteur_attribution FROM anon, authenticated;

COMMIT;
