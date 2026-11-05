-- Revert tet:demarche/pcaet_avis_plusieurs_pieces from pg

BEGIN;

-- Seule la première pièce survit : les annexes sont perdues.
ALTER TABLE public.demarche_pcaet_avis
    DROP CONSTRAINT demarche_pcaet_avis_valide_avec_piece_jointe,
    ADD COLUMN fichier_ref text NULL;

UPDATE public.demarche_pcaet_avis
SET fichier_ref = fichier_refs[1];

ALTER TABLE public.demarche_pcaet_avis
    DROP COLUMN fichier_refs,
    ADD CONSTRAINT demarche_pcaet_avis_valide_avec_piece_jointe
        CHECK (valide_le IS NULL OR fichier_ref IS NOT NULL);

COMMENT ON COLUMN public.demarche_pcaet_avis.fichier_ref IS 'Référence de la PJ dans le bucket de la collectivité émettrice ; nullable pour permettre un brouillon sans PJ, obligatoire à la validation (contrainte).';

COMMIT;
