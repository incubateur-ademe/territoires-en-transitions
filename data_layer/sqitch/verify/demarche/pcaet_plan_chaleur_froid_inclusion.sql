-- Verify tet:demarche/pcaet_plan_chaleur_froid_inclusion on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT array_agg(substitut_id ORDER BY substitut_id)
        FROM public.demarche_document_substitution
        WHERE document_id = 'pcaet_plan_chaleur_froid'
          AND NOT automatic
    ) = ARRAY['pcaet_diagnostic', 'pcaet_plan_actions',
              'pcaet_strategie_territoriale'],
        'Le PLCF doit pouvoir être déclaré compris dans le diagnostic, la stratégie ou le programme d''actions';
END $$;

ROLLBACK;
