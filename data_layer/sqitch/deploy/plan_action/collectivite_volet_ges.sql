-- Deploy tet:plan_action/collectivite_volet_ges to pg
-- requires: plan_action/classification_volets_par_collectivite

BEGIN;

ALTER TABLE public.classification_volets_job
    ADD COLUMN etape text NOT NULL DEFAULT 'classification';

ALTER TABLE public.classification_volets_job
    ALTER COLUMN etape DROP DEFAULT;

ALTER TABLE public.classification_volets_job
    ADD CONSTRAINT classification_volets_job_etape_check
        CHECK (etape IN ('classification', 'mobilisation'));

COMMENT ON COLUMN public.classification_volets_job.etape IS
  'Etape de l''analyse. Hors de la cle d''unicite in-flight : la mobilisation consomme la sortie de la classification, les deux ne peuvent pas tourner ensemble sur une meme collectivite.';

CREATE TABLE public.collectivite_volet_ges
(
    collectivite_id integer         NOT NULL REFERENCES public.collectivite (id) ON DELETE CASCADE,
    levier_id       levier_ges_id   NOT NULL,
    categorie       volet_categorie NOT NULL,
    note            smallint        NOT NULL,
    fiche_ids       integer[]       NOT NULL DEFAULT '{}',
    created_at      timestamptz     NOT NULL DEFAULT now(),
    PRIMARY KEY (collectivite_id, levier_id, categorie),
    CONSTRAINT collectivite_volet_ges_note_check CHECK (note BETWEEN 0 AND 3)
);

COMMENT ON TABLE public.collectivite_volet_ges IS
  'Mobilisation d''une collectivite sur chaque volet, notee de 0 a 3. Six lignes par levier effectivement classe, zeros compris : une case a 0 vaut evaluee et sans action. Un levier qu''aucune fiche ne touche n''a aucune ligne, il n''a jamais ete soumis au modele.';

COMMENT ON COLUMN public.collectivite_volet_ges.fiche_ids IS
  'Fiches qui ont nourri la note, au moment du run. Instantane sans cle etrangere : un identifiant peut ne plus resoudre, tout lecteur doit le tolerer.';

ALTER TABLE public.collectivite_volet_ges ENABLE ROW LEVEL SECURITY;
-- RLS sans policy : seul service_role accede a la table, qui derive du contenu de fiches.

COMMIT;
