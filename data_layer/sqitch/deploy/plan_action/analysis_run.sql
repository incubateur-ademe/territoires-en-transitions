-- Deploy tet:plan_action/analysis_run to pg

BEGIN;

CREATE TABLE public.analysis_run
(
    id          integer     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    started_at  timestamptz NOT NULL,
    finished_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.analysis_run IS
  'Passages quotidiens d''analyse des fiches menes a terme. La date de debut du dernier sert de repere au passage suivant pour lister les fiches modifiees depuis.';

ALTER TABLE public.analysis_run ENABLE ROW LEVEL SECURITY;

COMMIT;
