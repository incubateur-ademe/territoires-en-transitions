-- Deploy tet:demarche/pcaet_avis_plusieurs_pieces to pg
-- requires: demarches/pcaet_avis_un_titre_par_emetteur

BEGIN;

-- Un avis peut tenir en plusieurs pièces : le courrier et son annexe. L'ordre du
-- tableau est celui du dépôt.
ALTER TABLE public.demarche_pcaet_avis
    ADD COLUMN fichier_refs text[] NOT NULL DEFAULT '{}';

UPDATE public.demarche_pcaet_avis
SET fichier_refs = ARRAY[fichier_ref]
WHERE fichier_ref IS NOT NULL;

ALTER TABLE public.demarche_pcaet_avis
    DROP CONSTRAINT demarche_pcaet_avis_valide_avec_piece_jointe,
    DROP COLUMN fichier_ref,
    ADD CONSTRAINT demarche_pcaet_avis_valide_avec_piece_jointe
        CHECK (valide_le IS NULL OR cardinality(fichier_refs) > 0);

COMMENT ON COLUMN public.demarche_pcaet_avis.fichier_refs IS 'Références des pièces dans le bucket de la collectivité émettrice, dans l''ordre du dépôt ; vide pour un brouillon sans pièce, au moins une à la validation (contrainte).';

COMMIT;
