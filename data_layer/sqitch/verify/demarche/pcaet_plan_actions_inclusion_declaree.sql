-- Verify tet:demarche/pcaet_plan_actions_inclusion_declaree on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT NOT automatic
        FROM public.demarche_document_substitution
        WHERE document_id = 'pcaet_plan_actions'
          AND substitut_id = 'pcaet_document_global'
    ), 'Le dépôt du PCAET global ne doit plus cocher d''office l''inclusion du programme d''actions';
END $$;

ROLLBACK;
