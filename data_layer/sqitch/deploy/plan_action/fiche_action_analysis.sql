-- Deploy tet:plan_action/fiche_action_analysis to pg
-- requires: plan_action/plan_action
-- requires: collectivite/collectivite

BEGIN;

CREATE TABLE public.fiche_action_analysis
(
    fiche_id        integer     PRIMARY KEY REFERENCES public.fiche_action (id) ON DELETE CASCADE,
    collectivite_id integer     NOT NULL REFERENCES public.collectivite (id) ON DELETE CASCADE,
    fingerprint     text,
    status          text        NOT NULL,
    retry_count     integer     NOT NULL DEFAULT 0,
    analyzed_at     timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fiche_action_analysis_status_check CHECK (status IN ('processed', 'stale', 'failed')),
    CONSTRAINT fiche_action_analysis_fingerprint_check CHECK (fingerprint ~ '^[0-9a-f]{64}$'),
    CONSTRAINT fiche_action_analysis_retry_count_check CHECK (retry_count >= 0),
    CONSTRAINT fiche_action_analysis_processed_fingerprint_check CHECK (status <> 'processed' OR fingerprint IS NOT NULL)
);

CREATE INDEX fiche_action_analysis_collectivite_id_idx
    ON public.fiche_action_analysis (collectivite_id);

COMMENT ON TABLE public.fiche_action_analysis IS
  'Etat de la derniere analyse de chaque fiche : traitee, perimee ou en erreur. Une fiche sans ligne n''a jamais ete analysee.';

COMMENT ON COLUMN public.fiche_action_analysis.fingerprint IS
  'Empreinte sha256 du titre et de la description lors de la derniere classification reussie ; nulle si la fiche n''a jamais ete classee.';

COMMENT ON COLUMN public.fiche_action_analysis.retry_count IS
  'Nombre de passages consecutifs dont la classification a echoue ; remis a 0 quand la fiche est classee ou devient perimee.';

ALTER TABLE public.fiche_action_analysis ENABLE ROW LEVEL SECURITY;

COMMIT;
