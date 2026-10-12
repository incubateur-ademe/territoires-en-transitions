-- Deploy tet:shared/action_de_reference_fiche to pg
-- requires: shared/action_de_reference
-- requires: plan_action/plan_action

BEGIN;

CREATE TABLE public.action_de_reference_fiche
(
    action_de_reference_id integer NOT NULL
        REFERENCES public.action_de_reference (id) ON DELETE CASCADE,
    fiche_id               integer NOT NULL
        REFERENCES public.fiche_action (id) ON DELETE CASCADE,
    PRIMARY KEY (action_de_reference_id, fiche_id)
);

CREATE INDEX action_de_reference_fiche_fiche_id_idx
    ON public.action_de_reference_fiche (fiche_id);

COMMENT ON TABLE public.action_de_reference_fiche IS
  'Fiches de collectivites qui servent d exemples de mise en oeuvre d une action de reference.';

ALTER TABLE public.action_de_reference_fiche ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.action_de_reference_fiche FROM anon, authenticated;

COMMIT;
