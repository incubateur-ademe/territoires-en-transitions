-- Revert tet:demarche/demarche_documents_substitution_unique from pg

BEGIN;

ALTER TABLE public.demarche_document_definition
    ADD COLUMN portee text NOT NULL DEFAULT 'section'
        CHECK (portee IN ('global', 'section'));

COMMENT ON COLUMN public.demarche_document_definition.portee IS
    'global : document unique regroupant l''ensemble du dossier. section : pièce du détail par section attendue.';

UPDATE public.demarche_document_definition
SET portee = 'global'
WHERE id = 'pcaet_document_global';

ALTER TABLE public.demarche_document_definition
    ADD COLUMN couverture_plateforme text NULL
        CHECK (couverture_plateforme IN ('plan_actions'));

COMMENT ON COLUMN public.demarche_document_definition.couverture_plateforme IS
    'Fonctionnalité de la plateforme qui couvre cette pièce sans dépôt de document, NULL si la pièce exige un document.';

UPDATE public.demarche_document_definition
SET couverture_plateforme = 'plan_actions'
WHERE id = 'pcaet_dispositif_suivi_evaluation';

DELETE FROM public.demarche_document_substitution
WHERE document_id = 'pcaet_dispositif_suivi_evaluation'
  AND substitut_id = 'pcaet_plan_actions';

COMMIT;
