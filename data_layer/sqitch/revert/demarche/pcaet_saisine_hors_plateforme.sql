-- Revert tet:demarche/pcaet_saisine_hors_plateforme from pg

BEGIN;

-- Ces saisines n'ont pas d'équivalent dans l'ancien vocabulaire : les supprimer
-- est le seul repli honnête, les dossiers concernés redevenant invisibles aux
-- services — l'état d'avant ce change.
DELETE FROM public.demarche_pcaet_demande_avis
WHERE source = 'depot_hors_plateforme';

ALTER TABLE public.demarche_pcaet_demande_avis
    DROP CONSTRAINT demarche_pcaet_demande_avis_source_check;

ALTER TABLE public.demarche_pcaet_demande_avis
    ADD CONSTRAINT demarche_pcaet_demande_avis_source_check
    CHECK (source IN ('seed', 'transmission'));

COMMIT;
