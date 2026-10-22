-- Revert tet:plan_action/axe_source_reprise_tec from pg

BEGIN;

UPDATE public.axe SET source = NULL WHERE source = 'reprise_tec';

ALTER TABLE public.axe
    DROP CONSTRAINT axe_source_check,
    ADD CONSTRAINT axe_source_check CHECK (source IN ('import_ia'));

COMMENT ON COLUMN public.axe.source IS
    'Origine du plan (axe racine) : import_ia pour un plan créé par l''import IA ; NULL pour un plan créé à la main.';

COMMIT;
