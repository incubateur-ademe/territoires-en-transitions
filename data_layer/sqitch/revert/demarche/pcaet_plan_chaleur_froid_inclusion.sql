-- Revert tet:demarche/pcaet_plan_chaleur_froid_inclusion from pg

BEGIN;

-- Une déclaration du PLCF ne tient plus que par le programme d'actions : celles
-- qui n'avaient que le diagnostic ou la stratégie pour les porter tombent.
DELETE FROM public.demarche_document AS declaration
WHERE declaration.document_id = 'pcaet_plan_chaleur_froid'
  AND declaration.fichier_id IS NULL
  AND declaration.url IS NULL
  AND NOT EXISTS (
      SELECT 1
      FROM public.demarche_document AS programme
      WHERE programme.demarche_id = declaration.demarche_id
        AND programme.document_id = 'pcaet_plan_actions'
        AND programme.etape = 'amont'
        AND programme.fichier_id IS NOT NULL
  );

DELETE FROM public.demarche_document_substitution
WHERE document_id = 'pcaet_plan_chaleur_froid'
  AND substitut_id IN ('pcaet_diagnostic', 'pcaet_strategie_territoriale');

COMMIT;
