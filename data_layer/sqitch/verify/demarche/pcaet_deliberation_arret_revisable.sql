-- Verify tet:demarche/pcaet_deliberation_arret_revisable on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT etape = 'both'
        FROM public.demarche_document_definition
        WHERE id = 'pcaet_deliberation_arret'
    ), 'La délibération d''arrêt doit être révisable après les avis';
END $$;

ROLLBACK;
