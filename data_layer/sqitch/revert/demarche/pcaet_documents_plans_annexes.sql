-- Revert tet:demarche/pcaet_documents_plans_annexes from pg

BEGIN;

-- Les dépôts partent avec leur pièce : la clé étrangère de demarche_document
-- vers le catalogue n'a pas d'ON DELETE, elle bloquerait la suppression.
-- Les substitutions, elles, cascadent.
DELETE FROM public.demarche_document
WHERE document_id IN ('pcaet_plan_qualite_air', 'pcaet_plan_chaleur_froid');

DELETE FROM public.demarche_document_definition
WHERE id IN ('pcaet_plan_qualite_air', 'pcaet_plan_chaleur_froid');

-- Restaure la chronologie laissée par pcaet_bilan_precedent_renomme.
UPDATE public.demarche_document_definition AS definition
SET ordre       = attendu.ordre,
    modified_at = now()
FROM (VALUES
    ('pcaet_dispositif_suivi_evaluation', 5),
    ('pcaet_ees', 6),
    ('pcaet_etude_impact', 7),
    ('pcaet_bilan_pcaet_precedent', 8),
    ('pcaet_deliberation_arret', 9),
    ('pcaet_memoire_reponse_avis', 10),
    ('pcaet_synthese_consultation_publique', 11),
    ('pcaet_deliberation_adoption', 12)
) AS attendu(id, ordre)
WHERE definition.id = attendu.id;

COMMIT;
