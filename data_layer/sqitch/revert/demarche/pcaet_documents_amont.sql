-- Revert tet:demarche/pcaet_documents_amont from pg

BEGIN;

-- Les substitutions de ces pièces partent avec elles (ON DELETE CASCADE).
DELETE FROM public.demarche_document_definition
WHERE id IN ('pcaet_deliberation_engagement',
             'pcaet_etude_impact',
             'pcaet_deliberation_arret');

-- Le document global couvrait toutes les sections amont, requises ou non.
INSERT INTO public.demarche_document_substitution (document_id, substitut_id)
SELECT definition.id, 'pcaet_document_global'
FROM public.demarche_document_definition AS definition
WHERE definition.demarche_type = 'pcaet'
  AND definition.portee = 'section'
  AND definition.etape = 'amont'
ON CONFLICT DO NOTHING;

-- Restaure l'ordre du catalogue tel que laissé par pcaet_documents_aval.
UPDATE public.demarche_document_definition AS definition
SET ordre       = attendu.ordre,
    modified_at = now()
FROM (VALUES
    ('pcaet_diagnostic', 1),
    ('pcaet_strategie_territoriale', 2),
    ('pcaet_plan_actions', 3),
    ('pcaet_dispositif_suivi_evaluation', 4),
    ('pcaet_ees', 5),
    ('pcaet_memoire_reponse_avis', 7),
    ('pcaet_synthese_consultation_publique', 8),
    ('pcaet_bilan_pcaet_precedent', 9),
    ('pcaet_deliberation_adoption', 10)
) AS attendu(id, ordre)
WHERE definition.id = attendu.id;

COMMIT;
