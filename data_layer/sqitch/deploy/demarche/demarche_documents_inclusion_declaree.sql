-- Deploy tet:demarche/demarche_documents_inclusion_declaree to pg
-- requires: demarche/pcaet_programme_actions

BEGIN;

-- ===========================================================================
-- 1. La substitution se lit désormais dans les deux sens : d'office (le dépôt
--    du substitut couvre la pièce) ou sur déclaration (il ouvre seulement à la
--    collectivité la possibilité de dire que la pièce est comprise dedans).
--    Toutes les substitutions en place restent automatiques.
-- ===========================================================================
ALTER TABLE public.demarche_document_substitution
    ADD COLUMN automatic boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.demarche_document_substitution.automatic IS
    'true : déposer substitut_id couvre document_id sans rien demander. false : la collectivité déclare, pièce par pièce, que document_id est compris dans substitut_id.';

-- ===========================================================================
-- 2. L'étude d'impact et la délibération d'arrêt ne se retrouvent pas
--    systématiquement dans le PCAET global : leur inclusion se déclare.
-- ===========================================================================
UPDATE public.demarche_document_substitution
SET automatic = false
WHERE substitut_id = 'pcaet_document_global'
  AND document_id IN ('pcaet_etude_impact', 'pcaet_deliberation_arret');

-- ===========================================================================
-- 3. La pièce globale porte le nom que le dépôt lui donne, et sa description ne
--    promet plus de couvrir tout le dossier : deux pièces en sortent.
-- ===========================================================================
UPDATE public.demarche_document_definition
SET nom         = 'PCAET global',
    description = 'Document unique regroupant une partie des pièces obligatoires attendues.',
    modified_at = now()
WHERE id = 'pcaet_document_global';

COMMIT;
