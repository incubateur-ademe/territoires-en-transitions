-- Deploy tet:demarche/pcaet_bilan_renouvellement to pg
-- requires: demarche/pcaet_documents_plans_annexes

BEGIN;

-- ===========================================================================
-- 1. Le bilan du PCAET qui s'achève n'a de sens que pour qui en a déjà mené un
--    à son terme. Attendu de ceux-là, invisible aux autres.
--
--    Limite connue : la plateforme ne connaît que les dépôts menés chez elle.
--    Un PCAET antérieur au produit lui est invisible, et la collectivité qui le
--    renouvelle passera par les pièces additionnelles jusqu'à l'import des
--    PCAET déposés.
-- ===========================================================================
UPDATE public.demarche_document_definition
SET requis          = true,
    expr_applicable = 'demarche(renouvellement)',
    modified_at     = now()
WHERE id = 'pcaet_bilan_pcaet_precedent';

-- ===========================================================================
-- 2. Aucune substitution : le bilan du PCAET précédent évalue un dossier clos,
--    il ne se trouve dans aucune des pièces du dépôt en cours — pas même dans
--    le PCAET global. Il se satisfait par son seul dépôt.
-- ===========================================================================
DELETE FROM public.demarche_document_substitution
WHERE document_id = 'pcaet_bilan_pcaet_precedent';

COMMIT;
