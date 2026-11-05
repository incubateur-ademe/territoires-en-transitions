-- Revert tet:demarche/pcaet_bilan_mi_parcours from pg

BEGIN;

-- Les dépôts partent avec leur pièce : la clé étrangère de demarche_document
-- vers le catalogue n'a pas d'ON DELETE, elle bloquerait la suppression.
DELETE FROM public.demarche_document
WHERE document_id = 'pcaet_bilan_mi_parcours_precedent';

DELETE FROM public.demarche_document_definition
WHERE id = 'pcaet_bilan_mi_parcours_precedent';

-- Restaure la chronologie laissée par pcaet_ees_absorbe_etude_impact.
UPDATE public.demarche_document_definition AS definition
SET ordre       = attendu.ordre,
    modified_at = now()
FROM (VALUES
    ('pcaet_deliberation_engagement', 1),
    ('pcaet_diagnostic', 2),
    ('pcaet_strategie_territoriale', 3),
    ('pcaet_plan_actions', 4),
    ('pcaet_plan_qualite_air', 5),
    ('pcaet_plan_chaleur_froid', 6),
    ('pcaet_dispositif_suivi_evaluation', 7),
    ('pcaet_ees', 8),
    ('pcaet_bilan_pcaet_precedent', 9),
    ('pcaet_deliberation_arret', 10),
    ('pcaet_memoire_reponse_avis', 11),
    ('pcaet_synthese_consultation_publique', 12),
    ('pcaet_deliberation_adoption', 13)
) AS attendu(id, ordre)
WHERE definition.id = attendu.id;

COMMIT;
