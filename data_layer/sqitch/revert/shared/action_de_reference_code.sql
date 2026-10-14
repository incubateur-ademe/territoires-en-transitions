-- Revert tet:shared/action_de_reference_code from pg

BEGIN;

ALTER TABLE public.action_de_reference
    DROP CONSTRAINT action_de_reference_code_format,
    DROP CONSTRAINT action_de_reference_code_unique,
    DROP COLUMN code;

COMMIT;
