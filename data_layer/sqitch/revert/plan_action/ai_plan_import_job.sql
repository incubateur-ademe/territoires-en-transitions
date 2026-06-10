-- Revert tet:plan_action/ai_plan_import_job from pg

BEGIN;

DELETE FROM storage.buckets WHERE id = 'ai-plan-import-sources';

DROP TABLE IF EXISTS public.ai_plan_import_job CASCADE;

COMMIT;
