-- Deploy tet:demarche/pcaet_document_global_retire to pg
-- requires: demarche/pcaet_plan_actions_tableurs

BEGIN;

-- Une pièce peut quitter le catalogue sans que les dossiers qui l'ont déposée
-- la perdent : elle n'est plus proposée, mais reste là où elle a été déposée.
-- La supprimer est impossible (demarche_document la référence) et viderait
-- des dossiers déjà transmis.
ALTER TABLE public.demarche_document_definition
    ADD COLUMN retired_at timestamptz NULL;

COMMENT ON COLUMN public.demarche_document_definition.retired_at IS
    'Date de retrait de la pièce du catalogue. Une pièce retirée n''est plus proposée qu''aux démarches qui l''ont déjà déposée. NULL = pièce proposée.';

-- On simplifie le dossier PCAET : seules les pièces détaillées sont demandées.
UPDATE public.demarche_document_definition
SET retired_at  = now(),
    modified_at = now()
WHERE id = 'pcaet_document_global';

COMMIT;
