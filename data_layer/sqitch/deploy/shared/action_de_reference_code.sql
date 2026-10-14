-- Deploy tet:shared/action_de_reference_code to pg
-- requires: shared/action_de_reference

BEGIN;

ALTER TABLE public.action_de_reference
    ADD COLUMN code text;

ALTER TABLE public.action_de_reference
    ADD CONSTRAINT action_de_reference_code_unique UNIQUE (code),
    ADD CONSTRAINT action_de_reference_code_format
        CHECK (code IS NULL OR code ~ '^AR[0-9]{3}$');

COMMENT ON COLUMN public.action_de_reference.code IS
  'Code metier stable de l action de reference (AR001 a AR084), sert a l import rejouable.';

COMMIT;
