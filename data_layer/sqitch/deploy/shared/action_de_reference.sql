-- Deploy tet:shared/action_de_reference to pg
-- requires: plan_action/classification_volets

BEGIN;

CREATE TABLE public.action_de_reference
(
    id          integer                GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    titre       text                   NOT NULL,
    description text                   NOT NULL,
    levier      public.levier_ges_id   NOT NULL,
    categorie   public.volet_categorie NOT NULL,
    CONSTRAINT action_de_reference_titre_non_vide
        CHECK (titre <> '' AND titre = btrim(titre, E' \t\n\u000B\f\r\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF')),
    CONSTRAINT action_de_reference_titre_longueur_max
        CHECK (char_length(titre) <= 300),
    CONSTRAINT action_de_reference_description_non_vide
        CHECK (description <> '' AND description = btrim(description, E' \t\n\u000B\f\r\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF')),
    CONSTRAINT action_de_reference_unique
        UNIQUE (levier, categorie, titre)
);

COMMENT ON TABLE public.action_de_reference IS
  'Actions recommandees par l ADEME, rattachees a un volet (levier x categorie).';

ALTER TABLE public.action_de_reference ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.action_de_reference FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.action_de_reference_id_seq FROM anon, authenticated;

COMMIT;
