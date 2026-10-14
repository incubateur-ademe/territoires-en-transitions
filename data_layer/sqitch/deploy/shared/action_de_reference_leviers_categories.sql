-- Deploy tet:shared/action_de_reference_leviers_categories to pg
-- requires: shared/action_de_reference_code

BEGIN;

ALTER TABLE public.action_de_reference
    ADD COLUMN leviers    public.levier_ges_id[]   NOT NULL DEFAULT '{}',
    ADD COLUMN categories public.volet_categorie[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.action_de_reference.leviers IS
  'Leviers de decarbonation de l action de reference, 1 a n valeurs.';

COMMENT ON COLUMN public.action_de_reference.categories IS
  'Categories de type d action de l action de reference, 1 a n valeurs.';

COMMIT;
