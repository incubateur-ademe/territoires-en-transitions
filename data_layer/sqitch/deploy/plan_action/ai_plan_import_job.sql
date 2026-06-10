-- Deploy tet:plan_action/ai_plan_import_job to pg

BEGIN;

CREATE TABLE public.ai_plan_import_job (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    collectivite_id integer     NOT NULL REFERENCES public.collectivite(id) ON DELETE CASCADE,
    created_by      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status          text        NOT NULL CHECK (status IN ('pending', 'running', 'done', 'failed')),
    options         jsonb       NOT NULL,
    step_states     jsonb       NOT NULL,
    source_path     text        NOT NULL,
    draft           jsonb       NULL,
    error           text        NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    modified_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ai_plan_import_job IS 'Job d''import asynchrone d''un plan d''action depuis un document libre via la pipeline IA.';
COMMENT ON COLUMN public.ai_plan_import_job.created_by IS 'Utilisateur·ice ayant lancé l''import.';
COMMENT ON COLUMN public.ai_plan_import_job.status IS 'pending | running | done | failed.';
COMMENT ON COLUMN public.ai_plan_import_job.options IS 'Options figées à l''enfilement : withVerifications, withSousActions, disabledFields[].';
COMMENT ON COLUMN public.ai_plan_import_job.step_states IS 'État par étape de la pipeline : ok | skipped | pending.';
COMMENT ON COLUMN public.ai_plan_import_job.source_path IS 'Clé de l''objet source dans le bucket temporaire ; supprimé au terme du job.';
COMMENT ON COLUMN public.ai_plan_import_job.draft IS 'Brouillon de plan produit (PlanDraft) ; NULL tant que le job n''est pas done.';
COMMENT ON COLUMN public.ai_plan_import_job.error IS 'Renseigné quand status = failed.';

CREATE UNIQUE INDEX ai_plan_import_job_in_flight_unique
    ON public.ai_plan_import_job (collectivite_id)
    WHERE status IN ('pending', 'running');

-- RLS sans policy : seul service_role accède à la table.
ALTER TABLE public.ai_plan_import_job ENABLE ROW LEVEL SECURITY;

-- Bucket privé temporaire : les documents source sont supprimés au terme du job.
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-plan-import-sources', 'ai-plan-import-sources', false)
ON CONFLICT DO NOTHING;

COMMIT;
