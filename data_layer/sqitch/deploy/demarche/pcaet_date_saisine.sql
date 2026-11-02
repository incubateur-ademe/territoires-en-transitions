-- Deploy tet:demarche/pcaet_date_saisine to pg
-- requires: demarche/pcaet_saisine_hors_plateforme

BEGIN;

CREATE TABLE public.demarche_pcaet_date_saisine (
    id            integer     PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    demarche_id   integer     NOT NULL REFERENCES public.demarche(id) ON DELETE CASCADE,
    date_saisine  date        NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now(),
    created_by    uuid        NULL REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX demarche_pcaet_date_saisine_demarche
    ON public.demarche_pcaet_date_saisine (demarche_id, created_at DESC);

COMMENT ON TABLE public.demarche_pcaet_date_saisine IS 'Dates de saisine d''un dépôt PCAET transmis hors plateforme, saisies par le service instructeur. Une ligne par saisie : la plus récente fait foi, les autres gardent l''historique.';

ALTER TABLE public.demarche_pcaet_date_saisine ENABLE ROW LEVEL SECURITY;

COMMIT;
