-- Deploy tet:collectivite/pertinence_levier_ges to pg
-- requires: collectivite/collectivite
-- requires: plan_action/classification_volets

BEGIN;

CREATE TYPE public.levier_pertinence AS ENUM ('non_pertinent', 'a_discuter', 'pertinent');

CREATE TABLE public.collectivite_levier_ges_pertinence
(
    collectivite_id integer                  NOT NULL REFERENCES public.collectivite (id) ON DELETE CASCADE,
    levier_id       public.levier_ges_id     NOT NULL,
    categorie       public.volet_categorie,
    pertinence      public.levier_pertinence NOT NULL,
    modified_at     timestamptz              NOT NULL DEFAULT now(),
    modified_by     uuid                     REFERENCES auth.users (id) ON DELETE SET NULL,
    CONSTRAINT collectivite_levier_ges_pertinence_unique
        UNIQUE NULLS NOT DISTINCT (collectivite_id, levier_id, categorie)
);

ALTER TABLE public.collectivite_levier_ges_pertinence ENABLE ROW LEVEL SECURITY;

COMMIT;
