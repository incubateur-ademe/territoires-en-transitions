-- Verify tet:demarche/pcaet_vulnerabilite_sous_thematiques on pg

BEGIN;

DO $$
DECLARE
    -- Nom distinct de la colonne : `parent_id` la masquerait dans les
    -- requêtes qui suivent.
    racine_id integer;
BEGIN
    SELECT id INTO racine_id
      FROM public.demarche_pcaet_vulnerabilite_thematique
     WHERE collectivite_id IS NULL AND code = 'risques_naturels';

    ASSERT racine_id IS NOT NULL,
        'La thématique « Risques naturels » doit être au socle';

    ASSERT (
        SELECT array_agg(code ORDER BY display_order)
          FROM public.demarche_pcaet_vulnerabilite_thematique
         WHERE parent_id = racine_id
    ) = array['risque_secheresse', 'risque_inondation', 'risque_incendie_foret',
              'risque_submersion_marine', 'risque_vagues_chaleur',
              'risque_recul_trait_cote', 'risque_retrait_gonflement_argiles',
              'risque_cyclones'],
        'Les huit risques naturels doivent se ranger sous leur parente, dans l''ordre';

    ASSERT (
        SELECT count(*) = 0
          FROM public.demarche_pcaet_vulnerabilite_thematique enfant
          JOIN public.demarche_pcaet_vulnerabilite_thematique parent
            ON parent.id = enfant.parent_id
         WHERE parent.parent_id IS NOT NULL
    ), 'La hiérarchie doit tenir sur un seul niveau';
END $$;

ROLLBACK;
