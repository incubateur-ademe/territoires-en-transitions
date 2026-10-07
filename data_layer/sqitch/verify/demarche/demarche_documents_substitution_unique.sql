-- Verify tet:demarche/demarche_documents_substitution_unique on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT NOT automatic
        FROM public.demarche_document_substitution
        WHERE document_id = 'pcaet_dispositif_suivi_evaluation'
          AND substitut_id = 'pcaet_plan_actions'
    ), 'Le dispositif de suivi doit se déclarer compris dans le programme d''actions';

    ASSERT (
        SELECT COUNT(*) = 0
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'demarche_document_definition'
          AND column_name IN ('couverture_plateforme', 'portee')
    ), 'Ni couverture_plateforme ni portee ne doivent subsister sur le catalogue';
END $$;

ROLLBACK;
