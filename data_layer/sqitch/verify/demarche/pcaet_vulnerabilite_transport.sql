-- Verify tet:demarche/pcaet_vulnerabilite_transport on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT count(*) = 1
          FROM public.demarche_pcaet_vulnerabilite_thematique
         WHERE collectivite_id IS NULL
           AND code = 'transport'
           AND label = 'Transport'
           AND parent_id IS NULL
           AND requis
    ), 'La thématique « Transport » doit être une racine requise du socle';

    -- Le rang la range après « Risques naturels », dont les sous-thématiques
    -- suivent le rang de leur parente.
    ASSERT (
        SELECT transport.display_order > risques.display_order
          FROM public.demarche_pcaet_vulnerabilite_thematique transport
         CROSS JOIN public.demarche_pcaet_vulnerabilite_thematique risques
         WHERE transport.collectivite_id IS NULL AND transport.code = 'transport'
           AND risques.collectivite_id IS NULL AND risques.code = 'risques_naturels'
    ), 'La thématique « Transport » doit se ranger après les risques naturels';
END $$;

ROLLBACK;
