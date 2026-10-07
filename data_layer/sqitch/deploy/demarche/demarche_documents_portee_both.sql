-- Deploy tet:demarche/demarche_documents_portee_both to pg
-- requires: demarche/demarche_documents_inclusion_par_defaut

BEGIN;

-- Une pièce du catalogue peut appartenir aux deux temps du dossier : attendue à
-- l'amont, et révisable à l'aval. Le diagnostic ou la stratégie qu'un avis avec
-- réserves conduit à reprendre en sont le cas type.
--
-- `both` n'exige rien de plus pour publier : la pièce reste requise à l'amont,
-- sa reprise est facultative.
ALTER TABLE public.demarche_document_definition
    DROP CONSTRAINT demarche_document_definition_etape_check;

ALTER TABLE public.demarche_document_definition
    ADD CONSTRAINT demarche_document_definition_etape_check
        CHECK (etape IN ('amont', 'aval', 'both'));

COMMENT ON COLUMN public.demarche_document_definition.etape IS
    'Temps du dossier auquel la pièce appartient : amont (exigée pour transmettre) | aval (exigée pour publier) | both (exigée à l''amont, révisable à l''aval).';

-- La pièce déposée porte désormais son propre temps : sans lui, redéposer une
-- pièce amont à l'aval écraserait la version transmise, alors que l'instruction
-- porte précisément sur celle-là.
ALTER TABLE public.demarche_document
    ADD COLUMN etape text NOT NULL DEFAULT 'amont'
        CHECK (etape IN ('amont', 'aval'));

COMMENT ON COLUMN public.demarche_document.etape IS
    'Temps du dossier où cette version a été déposée. Une pièce de portée both en a jusqu''à deux : la version amont n''est jamais écrasée.';

-- Les pièces déjà déposées le sont au temps de leur définition : c'était la
-- seule possibilité avant ce changement.
UPDATE public.demarche_document d
SET etape = def.etape
FROM public.demarche_document_definition def
WHERE def.id = d.document_id AND def.etape = 'aval';

-- « Remplacer » reste un upsert, mais à temps égal : une version par (démarche,
-- pièce, temps).
DROP INDEX public.demarche_document_demarche_id_document_id_key;

CREATE UNIQUE INDEX demarche_document_demarche_id_document_id_etape_key
    ON public.demarche_document (demarche_id, document_id, etape);

-- Les pièces que la collectivité reprend après les avis : le fond du dossier.
-- Les délibérations n'y sont pas — un acte daté ne se révise pas, il est
-- remplacé par un autre acte, et la délibération d'adoption est déjà une pièce
-- aval à part entière.
UPDATE public.demarche_document_definition
SET etape = 'both'
WHERE demarche_type = 'pcaet'
  AND id IN (
      'pcaet_document_global',
      'pcaet_diagnostic',
      'pcaet_strategie_territoriale',
      'pcaet_plan_actions',
      'pcaet_dispositif_suivi_evaluation',
      'pcaet_etude_impact'
  );

COMMIT;
