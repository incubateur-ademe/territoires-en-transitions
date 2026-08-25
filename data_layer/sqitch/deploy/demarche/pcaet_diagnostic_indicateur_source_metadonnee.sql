-- Deploy tet:demarche/pcaet_diagnostic_indicateur_source_metadonnee to pg

BEGIN;

-- Lien PCAET ↔ source métadonnée utilisée pour rattacher les valeurs saisies
-- en `indicateur_valeur` à une version de source dédiée par démarche et
-- collectivité.
CREATE TABLE public.demarche_pcaet_source_metadonnee (
  demarche_id integer NOT NULL
    REFERENCES public.demarche(id) ON DELETE CASCADE,
  collectivite_id integer NOT NULL
    REFERENCES public.collectivite(id) ON DELETE CASCADE,
  metadonnee_id integer NOT NULL
    REFERENCES public.indicateur_source_metadonnee(id) ON DELETE CASCADE,
  PRIMARY KEY (demarche_id, collectivite_id)
);

CREATE INDEX demarche_pcaet_source_metadonnee_metadonnee_id_idx
  ON public.demarche_pcaet_source_metadonnee (metadonnee_id);

ALTER TABLE public.demarche_pcaet_source_metadonnee ENABLE ROW LEVEL SECURITY;

COMMIT;

