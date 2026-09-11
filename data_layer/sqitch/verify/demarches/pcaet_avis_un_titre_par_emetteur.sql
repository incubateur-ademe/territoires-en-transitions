-- Verify tet:demarches/pcaet_avis_un_titre_par_emetteur on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT pg_get_constraintdef(oid) NOT LIKE '%autorite_environnementale%'
        FROM pg_constraint
        WHERE conname = 'demarche_pcaet_avis_au_titre_de_check'
    ), 'Le titre autorite_environnementale ne doit plus être permis';

    ASSERT NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'demarche_pcaet_avis'
          AND column_name = 'sens'
    ), 'La colonne sens doit avoir disparu';

    ASSERT NOT EXISTS (
        SELECT 1 FROM public.demarche_pcaet_avis
        WHERE au_titre_de = 'autorite_environnementale'
    ), 'Aucun avis au titre de l''autorité environnementale ne doit subsister';
END $$;

ROLLBACK;
