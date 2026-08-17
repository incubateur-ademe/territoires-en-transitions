-- Revert tet:demarche/statut_publication_fusionne from pg

BEGIN;

ALTER TABLE public.demarche
    ADD COLUMN publication_status text NOT NULL DEFAULT 'draft'
    CHECK (publication_status IN ('draft', 'published'));

-- Un dossier publié ou archivé était visible du public ; les statuts publiés
-- retrouvent leur couple (status, publication_status).
UPDATE public.demarche
SET publication_status = 'published'
WHERE type = 'pcaet' AND status IN ('publie', 'archive');

ALTER TABLE public.demarche DROP CONSTRAINT demarche_status_check;

UPDATE public.demarche
SET status = 'adopte'
WHERE type = 'pcaet' AND status = 'publie';

-- Nom d'origine restauré : c'est celui que Postgres génère pour un CHECK
-- portant sur deux colonnes.
ALTER TABLE public.demarche ADD CONSTRAINT demarche_check CHECK (
    type = 'pcaet' AND status IN (
    'en_elaboration', 'transmis_pour_avis', 'adopte', 'archive'));

COMMENT ON COLUMN public.demarche.publication_status IS
    'Statut de publication visible dans l''interface : draft | published.';

COMMIT;
