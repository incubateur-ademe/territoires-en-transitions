-- Deploy tet:plan_action/secteur_reglementaire_thematiques to pg
-- requires: plan_action/fiche_action_secteur_attribution

BEGIN;

ALTER TYPE public.secteur_reglementaire ADD VALUE 'amenagement';
ALTER TYPE public.secteur_reglementaire ADD VALUE 'biodiversite';
ALTER TYPE public.secteur_reglementaire ADD VALUE 'eau';
ALTER TYPE public.secteur_reglementaire ADD VALUE 'foret_et_sols';
ALTER TYPE public.secteur_reglementaire ADD VALUE 'economie';
ALTER TYPE public.secteur_reglementaire ADD VALUE 'sante';
ALTER TYPE public.secteur_reglementaire ADD VALUE 'risques_naturels';

COMMENT ON TYPE public.secteur_reglementaire IS
  'Secteurs reglementaires d une fiche : les 8 secteurs d activite de l article R. 229-52 du code de l environnement, avec les codes de l API Communs, puis les thematiques amenagement, biodiversite, eau, foret et sols, economie, sante et risques naturels, que Communs ne propose pas.';

COMMIT;
