-- Revert tet:plan_action/ai_plan_import_question from pg

BEGIN;

-- Aucun worker ne peut plus mettre un import en attente pendant le revert.
LOCK TABLE public.ai_plan_import_job IN ACCESS EXCLUSIVE MODE;

-- Les imports qui attendent une réponse n'ont pas d'équivalent : ils échouent.
UPDATE public.ai_plan_import_job
SET status = 'failed',
    error = 'Import arrêté : la précision demandée n''est plus prise en charge',
    checkpoint = NULL,
    finished_at = now(),
    modified_at = now()
WHERE status = 'awaiting_answer';

DROP INDEX public.ai_plan_import_job_in_flight_unique;
CREATE UNIQUE INDEX ai_plan_import_job_in_flight_unique
    ON public.ai_plan_import_job (collectivite_id)
    WHERE status IN ('pending', 'running');

ALTER TABLE public.ai_plan_import_job
    DROP CONSTRAINT ai_plan_import_job_status_check,
    ADD CONSTRAINT ai_plan_import_job_status_check CHECK (
        status IN ('pending', 'running', 'done', 'failed')
    ),
    DROP COLUMN question;

COMMIT;
