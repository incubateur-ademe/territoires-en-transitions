-- Verify tet:demarche/pcaet_vulnerabilite_thematique_socle_recadre on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT COUNT(*) = 9
        FROM public.demarche_pcaet_vulnerabilite_thematique
        WHERE collectivite_id IS NULL
    ), 'Le socle recadré doit compter 9 thématiques';

    ASSERT (
        SELECT array_agg(code ORDER BY display_order)
        FROM public.demarche_pcaet_vulnerabilite_thematique
        WHERE collectivite_id IS NULL
    ) = array['agriculture', 'amenagement', 'batiments', 'biodiversite', 'eau',
              'foret', 'energie', 'economie', 'sante'],
        'Le socle doit suivre la liste et l''ordre du proto';

    ASSERT (
        SELECT bool_and(requis)
        FROM public.demarche_pcaet_vulnerabilite_thematique
        WHERE collectivite_id IS NULL
    ), 'Toutes les thématiques du socle recadré restent requises';
END $$;

ROLLBACK;
