-- Verify tet:demarche/pcaet_avis_plusieurs_pieces on pg

BEGIN;

SELECT fichier_refs
FROM public.demarche_pcaet_avis
WHERE false;

DO $$
BEGIN
    ASSERT NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'demarche_pcaet_avis'
          AND column_name = 'fichier_ref'
    ), 'La colonne fichier_ref doit avoir été remplacée par fichier_refs';
END $$;

ROLLBACK;
