-- Revert tet:demarche/demarche_documents_etape from pg

BEGIN;

-- Restaure la couverture par le document global des pièces repassées en amont.
INSERT INTO public.demarche_document_substitution (document_id, substitut_id)
SELECT definition.id, 'pcaet_document_global'
FROM public.demarche_document_definition AS definition
WHERE definition.demarche_type = 'pcaet'
  AND definition.portee = 'section'
  AND definition.etape = 'aval'
ON CONFLICT DO NOTHING;

-- Restaure la délibération d'adoption telle que seedée par demarche_documents.
UPDATE public.demarche_document_definition
SET nom         = 'Délibération d''adoption',
    requis      = false,
    ordre       = 6,
    modified_at = now()
WHERE id = 'pcaet_deliberation_adoption';

ALTER TABLE public.demarche_document_definition DROP COLUMN etape;

COMMIT;
