-- Deploy tet:plan_action/axe_source_reprise_tec to pg

BEGIN;

ALTER TABLE public.axe
    DROP CONSTRAINT axe_source_check,
    ADD CONSTRAINT axe_source_check CHECK (source IN ('import_ia', 'reprise_tec'));

COMMENT ON COLUMN public.axe.source IS
    'Origine du plan (axe racine) : import_ia pour un plan créé par l''import IA, reprise_tec pour un plan repris de Territoires & Climat ; NULL pour un plan créé à la main.';

COMMIT;
