-- Deploy tet:plan_action/ai_plan_import_question to pg
-- requires: plan_action/ai_plan_import_reprise

BEGIN;

-- La contrainte du statut a été déclarée en ligne, sans nom : on la retrouve
-- par sa définition plutôt que par le nom généré par Postgres.
DO $$
DECLARE
    status_check text;
BEGIN
    FOR status_check IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.ai_plan_import_job'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE '%status%'
    LOOP
        EXECUTE format(
            'ALTER TABLE public.ai_plan_import_job DROP CONSTRAINT %I',
            status_check
        );
    END LOOP;
END $$;

ALTER TABLE public.ai_plan_import_job
    ADD CONSTRAINT ai_plan_import_job_status_check CHECK (
        status IN ('pending', 'running', 'done', 'failed', 'awaiting_answer')
    ),
    ADD COLUMN question jsonb NULL;

COMMENT ON COLUMN public.ai_plan_import_job.question IS
    'Précision demandée à l''utilisateur après la lecture, quand le document laisse un doute (niveau de l''action), et sa réponse.';

-- Un import qui attend une réponse occupe sa collectivité comme un import en cours.
DROP INDEX public.ai_plan_import_job_in_flight_unique;
CREATE UNIQUE INDEX ai_plan_import_job_in_flight_unique
    ON public.ai_plan_import_job (collectivite_id)
    WHERE status IN ('pending', 'running', 'awaiting_answer');

COMMIT;
