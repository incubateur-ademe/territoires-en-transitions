-- Verify tet:demarche/pcaet_plan_chaleur_froid_detection on pg

BEGIN;

SELECT id, demarche_id, document_id, included_document_id, fichier_id, status,
       is_included, parties, section_title, pages, justification, model, created_at,
       analyzed_at
FROM public.demarche_document_detection
WHERE false;

DO $$
BEGIN
    ASSERT (
        SELECT array_agg(substitut_id ORDER BY substitut_id)
        FROM public.demarche_document_substitution
        WHERE document_id = 'pcaet_plan_chaleur_froid'
          AND is_detection_required
          AND NOT automatic
    ) = ARRAY['pcaet_diagnostic', 'pcaet_plan_actions',
              'pcaet_strategie_territoriale'],
        'Le PLCF doit pouvoir être détecté dans le diagnostic, la stratégie et le programme d''actions';

    ASSERT (
        SELECT count(*) = 0
        FROM public.demarche_document_substitution
        WHERE document_id <> 'pcaet_plan_chaleur_froid'
          AND is_detection_required
    ), 'Seul le PLCF dépend d''une détection';
END $$;

ROLLBACK;
