-- Revert tet:demarche/pcaet_documents_aval from pg

BEGIN;

UPDATE public.demarche_document_definition
SET etape       = 'amont',
    modified_at = now()
WHERE id IN ('pcaet_memoire_reponse_avis',
             'pcaet_synthese_consultation_publique');

-- Repassées en amont, ces deux pièces rentrent à nouveau dans le périmètre du
-- document global.
INSERT INTO public.demarche_document_substitution (document_id, substitut_id)
VALUES ('pcaet_memoire_reponse_avis', 'pcaet_document_global'),
       ('pcaet_synthese_consultation_publique', 'pcaet_document_global')
ON CONFLICT DO NOTHING;

COMMIT;
