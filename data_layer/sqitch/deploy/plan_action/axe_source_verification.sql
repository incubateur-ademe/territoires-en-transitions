-- Deploy tet:plan_action/axe_source_verification to pg

BEGIN;

ALTER TABLE public.axe
    ADD COLUMN source      text        NULL CONSTRAINT axe_source_check CHECK (source IN ('import_ia')),
    ADD COLUMN verified_at timestamptz NULL,
    ADD COLUMN verified_by uuid        NULL REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.axe.source IS
    'Origine du plan (axe racine) : import_ia pour un plan créé par l''import IA ; NULL pour un plan créé à la main.';
COMMENT ON COLUMN public.axe.verified_at IS
    'Date à laquelle un utilisateur a confirmé que le plan importé est conforme à son document source ; NULL tant que non vérifié.';
COMMENT ON COLUMN public.axe.verified_by IS
    'Utilisateur ayant confirmé la vérification du plan importé.';

COMMIT;
