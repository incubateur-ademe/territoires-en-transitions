-- Deploy tet:plan_action/ai_plan_import_telemetrie to pg
-- requires: plan_action/axe_status

BEGIN;

ALTER TABLE public.ai_plan_import_job
    ADD COLUMN started_at  timestamptz NULL,
    ADD COLUMN finished_at timestamptz NULL,
    ADD COLUMN stats       jsonb       NULL;

COMMENT ON COLUMN public.ai_plan_import_job.started_at IS
    'Prise en charge par le worker : l''écart avec created_at est l''attente en file.';
COMMENT ON COLUMN public.ai_plan_import_job.finished_at IS
    'Fin du traitement, réussi ou en échec.';
COMMENT ON COLUMN public.ai_plan_import_job.stats IS
    'Résumé chiffré de l''import (contenu extrait, document lu, appels au modèle), versionné par schemaVersion.';

CREATE TABLE public.ai_plan_import_step_run (
    id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id             uuid        NOT NULL REFERENCES public.ai_plan_import_job(id) ON DELETE CASCADE,
    step               text        NOT NULL,
    status             text        NOT NULL CHECK (status IN ('ok', 'skipped', 'failed')),
    started_at         timestamptz NOT NULL,
    ended_at           timestamptz NOT NULL,
    duration_ms        integer     NOT NULL,
    llm_calls          integer     NOT NULL DEFAULT 0,
    failed_calls       integer     NOT NULL DEFAULT 0,
    rate_limited_calls integer     NOT NULL DEFAULT 0,
    tokens             jsonb       NOT NULL,
    models             text[]      NOT NULL DEFAULT '{}',
    details            jsonb       NOT NULL DEFAULT '{}',
    error              text        NULL,
    CONSTRAINT ai_plan_import_step_run_job_step_unique UNIQUE (job_id, step)
);

COMMENT ON TABLE public.ai_plan_import_step_run IS
    'Déroulé d''un import IA, étape par étape : durées, appels au modèle et jetons, pour comparer modèles et documents.';
COMMENT ON COLUMN public.ai_plan_import_step_run.step IS
    'document (lecture et OCR), étapes de la pipeline, puis persistence (création du plan).';
COMMENT ON COLUMN public.ai_plan_import_step_run.tokens IS
    'Jetons cumulés de l''étape, tentatives en échec comprises (promptTokens, cachedTokens, candidatesTokens, thoughtsTokens, totalTokens).';
COMMENT ON COLUMN public.ai_plan_import_step_run.models IS
    'Modèles appelés pendant l''étape ; plusieurs quand l''étape mêle des paliers.';
COMMENT ON COLUMN public.ai_plan_import_step_run.details IS
    'Comptes propres à l''étape : actions en entrée et en sortie, unités, avertissements…';

-- RLS sans policy : seul service_role accède à la table.
ALTER TABLE public.ai_plan_import_step_run ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_plan_import_step_run FROM anon, authenticated;

COMMIT;
