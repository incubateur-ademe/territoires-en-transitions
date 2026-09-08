-- Deploy tet:plan_action/classification_leviers_job to pg

BEGIN;

CREATE TABLE public.classification_leviers_job (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    collectivite_id integer     NOT NULL REFERENCES public.collectivite(id) ON DELETE CASCADE,
    plan_id         integer     NOT NULL REFERENCES public.axe(id) ON DELETE CASCADE,
    created_by      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status          text        NOT NULL CHECK (status IN ('pending', 'running', 'done', 'failed')),
    processed_batches integer   NOT NULL DEFAULT 0,
    total_batches     integer   NOT NULL DEFAULT 0,
    draft           jsonb       NULL,
    token_usage     jsonb       NULL,
    error           text        NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    modified_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.classification_leviers_job IS 'Job asynchrone de classification IA des fiches d''un plan par levier de decarbonation.';
COMMENT ON COLUMN public.classification_leviers_job.plan_id IS 'Axe racine du plan classe ; un sous-axe est refuse a l''enfilement.';
COMMENT ON COLUMN public.classification_leviers_job.created_by IS 'Utilisateur ayant lance la classification.';
COMMENT ON COLUMN public.classification_leviers_job.status IS 'pending | running | done | failed.';
COMMENT ON COLUMN public.classification_leviers_job.processed_batches IS 'Nombre de lots termines, reussis ou non ; sert la progression.';
COMMENT ON COLUMN public.classification_leviers_job.total_batches IS 'Nombre de lots a traiter, connu une fois les fiches lues.';
COMMENT ON COLUMN public.classification_leviers_job.draft IS 'Resultat propose (ClassificationDraft), fiches non classees comprises ; NULL tant que le job n''est pas done.';
COMMENT ON COLUMN public.classification_leviers_job.token_usage IS 'Jetons consommes, cumules sur tous les lots.';
COMMENT ON COLUMN public.classification_leviers_job.error IS 'Renseigne quand status = failed.';

CREATE UNIQUE INDEX classification_leviers_job_in_flight_unique
    ON public.classification_leviers_job (plan_id)
    WHERE status IN ('pending', 'running');

-- RLS sans policy : seul service_role accede a la table, qui porte du contenu de fiches.
ALTER TABLE public.classification_leviers_job ENABLE ROW LEVEL SECURITY;

COMMIT;
