-- Verify tet:demarche/pcaet_programme_actions on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT nom = 'Programme d''actions'
        FROM public.demarche_document_definition
        WHERE id = 'pcaet_plan_actions'
    ), 'La pièce pcaet_plan_actions doit s''intituler « Programme d''actions »';
END $$;

ROLLBACK;
