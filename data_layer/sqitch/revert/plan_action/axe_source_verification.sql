-- Revert tet:plan_action/axe_source_verification from pg

BEGIN;

ALTER TABLE public.axe
    DROP COLUMN IF EXISTS verified_by,
    DROP COLUMN IF EXISTS verified_at,
    DROP COLUMN IF EXISTS source;

COMMIT;
