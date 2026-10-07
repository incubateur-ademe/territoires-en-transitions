-- Revert tet:plan_action/classification_leviers_job from pg

BEGIN;

DROP TABLE IF EXISTS public.classification_leviers_job CASCADE;

COMMIT;
