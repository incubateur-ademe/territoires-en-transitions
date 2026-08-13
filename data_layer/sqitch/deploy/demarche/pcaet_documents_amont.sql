-- Deploy tet:demarche/pcaet_documents_amont to pg
-- requires: demarche/pcaet_documents_aval

BEGIN;

-- ===========================================================================
-- 1. Trois pièces attendues de plus dans le dossier d'élaboration : les
--    délibérations qui ouvrent et ferment l'élaboration, et l'étude d'impact.
--    Idempotent, comme le seed initial du catalogue.
-- ===========================================================================
INSERT INTO public.demarche_document_definition
    (id, demarche_type, nom, description, requis, ordre, portee,
     couverture_plateforme, etape)
VALUES
    ('pcaet_deliberation_engagement', 'pcaet',
     'Délibération d''engagement / déclaration d''intention', '',
     false, 1, 'section', NULL, 'amont'),
    ('pcaet_etude_impact', 'pcaet',
     'Étude d''impact (dont résumé non technique)', '',
     true, 7, 'section', NULL, 'amont'),
    ('pcaet_deliberation_arret', 'pcaet',
     'Délibération d''arrêt du PCAET', '',
     true, 9, 'section', NULL, 'amont')
ON CONFLICT (id) DO UPDATE SET
    demarche_type         = excluded.demarche_type,
    nom                   = excluded.nom,
    description           = excluded.description,
    requis                = excluded.requis,
    ordre                 = excluded.ordre,
    portee                = excluded.portee,
    couverture_plateforme = excluded.couverture_plateforme,
    etape                 = excluded.etape,
    modified_at           = now();

-- ===========================================================================
-- 2. Le catalogue suit la chronologie de la démarche, de la délibération
--    d'engagement à celle d'adoption. Les pièces déjà en place gardent leur
--    ordre relatif, elles ne font que laisser la place aux nouvelles.
-- ===========================================================================
UPDATE public.demarche_document_definition AS definition
SET ordre       = attendu.ordre,
    modified_at = now()
FROM (VALUES
    ('pcaet_diagnostic', 2),
    ('pcaet_strategie_territoriale', 3),
    ('pcaet_plan_actions', 4),
    ('pcaet_dispositif_suivi_evaluation', 5),
    ('pcaet_ees', 6),
    ('pcaet_bilan_pcaet_precedent', 8),
    ('pcaet_memoire_reponse_avis', 10),
    ('pcaet_synthese_consultation_publique', 11),
    ('pcaet_deliberation_adoption', 12)
) AS attendu(id, ordre)
WHERE definition.id = attendu.id;

-- ===========================================================================
-- 3. Périmètre du document global : les sections requises du dossier
--    d'élaboration, et elles seules. Une pièce optionnelle ne figure pas dans
--    la liste des substitutions — déposer le document global ne la déclare pas
--    fournie. C'est de la donnée, pas une règle de couverture particulière.
-- ===========================================================================
DELETE FROM public.demarche_document_substitution
WHERE substitut_id = 'pcaet_document_global'
  AND document_id IN (
      SELECT id FROM public.demarche_document_definition WHERE NOT requis
  );

INSERT INTO public.demarche_document_substitution (document_id, substitut_id)
SELECT definition.id, 'pcaet_document_global'
FROM public.demarche_document_definition AS definition
WHERE definition.demarche_type = 'pcaet'
  AND definition.portee = 'section'
  AND definition.etape = 'amont'
  AND definition.requis
ON CONFLICT DO NOTHING;

COMMIT;
