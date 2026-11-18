-- Deploy tet:collectivite/tableau_de_bord_module_plan_id to pg
-- requires: collectivite/tableau_de_bord_module_sans_moddatetime

BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE public.tableau_de_bord_module
    ADD COLUMN plan_id integer
    CONSTRAINT tableau_de_bord_module_plan_id_fkey
    REFERENCES public.axe (id) ON DELETE CASCADE;

CREATE INDEX tableau_de_bord_module_plan_id_idx
    ON public.tableau_de_bord_module (plan_id)
    WHERE plan_id IS NOT NULL;

COMMIT;
