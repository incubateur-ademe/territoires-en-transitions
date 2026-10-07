-- Deploy tet:demarche/demarche_documents_applicabilite to pg
-- requires: demarche/pcaet_bilan_precedent_renomme

BEGIN;

-- Toutes les pièces du catalogue ne concernent pas toutes les collectivités :
-- un plan de qualité de l'air n'est attendu que des territoires assujettis. La
-- condition est une donnée, dans le même langage que les règles de
-- personnalisation — elle s'ajuste par un UPDATE, sans déploiement.
ALTER TABLE public.demarche_document_definition
    ADD COLUMN expr_applicable text NULL
        CONSTRAINT demarche_document_definition_expr_applicable_non_vide
        CHECK (expr_applicable IS NULL OR btrim(expr_applicable) <> '');

COMMENT ON COLUMN public.demarche_document_definition.expr_applicable IS
    'Condition d''assujettissement de la collectivité, dans le langage des règles de personnalisation : identite(champ, valeur), reponse(question[, valeur]), si/alors/sinon, et/ou. NULL = pièce attendue de toute collectivité. Évaluée à faux, la pièce est absente du modèle servi : ni affichée, ni comptée dans la complétude. Ne jamais rendre conditionnelles toutes les pièces amont requises d''un type de démarche, sous peine de rendre son dossier incomplétable.';

COMMIT;
