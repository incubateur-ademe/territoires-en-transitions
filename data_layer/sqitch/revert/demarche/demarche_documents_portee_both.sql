-- Revert tet:demarche/demarche_documents_portee_both from pg

BEGIN;

-- Les versions aval des pièces amont n'ont pas d'équivalent dans l'ancien
-- modèle : une seule version par pièce y tient. On garde la version amont, qui
-- est celle sur laquelle l'instruction a porté.
DELETE FROM public.demarche_document d
WHERE d.etape = 'aval'
  AND EXISTS (
      SELECT 1 FROM public.demarche_document_definition def
      WHERE def.id = d.document_id AND def.etape <> 'aval'
  );

DROP INDEX public.demarche_document_demarche_id_document_id_etape_key;

CREATE UNIQUE INDEX demarche_document_demarche_id_document_id_key
    ON public.demarche_document (demarche_id, document_id);

ALTER TABLE public.demarche_document DROP COLUMN etape;

UPDATE public.demarche_document_definition SET etape = 'amont' WHERE etape = 'both';

ALTER TABLE public.demarche_document_definition
    DROP CONSTRAINT demarche_document_definition_etape_check;

ALTER TABLE public.demarche_document_definition
    ADD CONSTRAINT demarche_document_definition_etape_check
        CHECK (etape IN ('amont', 'aval'));

COMMENT ON COLUMN public.demarche_document_definition.etape IS
    'Étape du cycle où la pièce est attendue : amont (dossier d''élaboration, exigée pour transmettre) | aval (produite après les avis, exigée pour publier).';

COMMIT;
