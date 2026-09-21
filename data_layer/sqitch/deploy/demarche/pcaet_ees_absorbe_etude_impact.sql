-- Deploy tet:demarche/pcaet_ees_absorbe_etude_impact to pg
-- requires: demarche/pcaet_bilan_renouvellement

BEGIN;

-- ===========================================================================
-- L'évaluation environnementale stratégique et l'« étude d'impact » sont la
-- même pièce : le catalogue en demandait deux, la collectivité en dépose une.
-- L'EES garde sa place et prend le régime de l'étude d'impact, qui disparaît.
-- (Mail de Louise du 1er septembre, arbitré au COSUI du même jour.)
-- ===========================================================================

-- ===========================================================================
-- 1. Les dépôts déjà faits sur l'étude d'impact reviennent à l'EES : c'est le
--    même document. Là où la démarche a rempli les deux lignes au même temps
--    du dossier, l'unicité (démarche, pièce, temps) impose d'en perdre une :
--    celle qui ne porte ni fichier ni lien cède la place — une simple
--    déclaration d'inclusion n'efface pas un dépôt — et à égalité c'est la
--    version déposée sous le nom de l'EES qui fait foi.
-- ===========================================================================
DELETE FROM public.demarche_document AS perdante
USING public.demarche_document AS gardee
WHERE perdante.demarche_id = gardee.demarche_id
  AND perdante.etape = gardee.etape
  AND perdante.document_id = 'pcaet_etude_impact'
  AND gardee.document_id = 'pcaet_ees'
  AND num_nonnulls(perdante.fichier_id, perdante.url)
      <= num_nonnulls(gardee.fichier_id, gardee.url);

-- Symétrique : la ligne EES vide s'efface devant le dépôt de l'étude d'impact.
DELETE FROM public.demarche_document AS perdante
USING public.demarche_document AS gardee
WHERE perdante.demarche_id = gardee.demarche_id
  AND perdante.etape = gardee.etape
  AND perdante.document_id = 'pcaet_ees'
  AND gardee.document_id = 'pcaet_etude_impact'
  AND num_nonnulls(perdante.fichier_id, perdante.url)
      < num_nonnulls(gardee.fichier_id, gardee.url);

UPDATE public.demarche_document
SET document_id = 'pcaet_ees',
    modified_at = now()
WHERE document_id = 'pcaet_etude_impact';

-- ===========================================================================
-- 2. L'EES devient la pièce que l'étude d'impact était : requise, et révisable
--    après les avis comme le reste du fond du dossier.
-- ===========================================================================
UPDATE public.demarche_document_definition
SET nom         = 'EES (évaluation environnementale stratégique - dont résumé non technique)',
    requis      = true,
    etape       = 'both',
    modified_at = now()
WHERE id = 'pcaet_ees';

-- Elle ne se trouve pas systématiquement dans le PCAET global : son inclusion
-- se déclare, comme celle de l'étude d'impact avant elle.
INSERT INTO public.demarche_document_substitution (document_id, substitut_id, automatic)
VALUES ('pcaet_ees', 'pcaet_document_global', false)
ON CONFLICT (document_id, substitut_id) DO UPDATE SET automatic = false;

-- ===========================================================================
-- 3. L'étude d'impact quitte le catalogue. Ses substitutions cascadent ; ses
--    dépôts sont déjà passés à l'EES.
-- ===========================================================================
DELETE FROM public.demarche_document_definition
WHERE id = 'pcaet_etude_impact';

-- ===========================================================================
-- 4. La chronologie se resserre d'un rang derrière l'EES.
-- ===========================================================================
UPDATE public.demarche_document_definition AS definition
SET ordre       = attendu.ordre,
    modified_at = now()
FROM (VALUES
    ('pcaet_bilan_pcaet_precedent', 9),
    ('pcaet_deliberation_arret', 10),
    ('pcaet_memoire_reponse_avis', 11),
    ('pcaet_synthese_consultation_publique', 12),
    ('pcaet_deliberation_adoption', 13)
) AS attendu(id, ordre)
WHERE definition.id = attendu.id;

COMMIT;
