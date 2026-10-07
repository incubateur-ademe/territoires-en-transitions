-- Revert tet:demarche/pcaet_plan_chaleur_froid_commune_membre from pg

BEGIN;

-- Retour à la condition laissée par pcaet_documents_plans_annexes : la
-- population propre de la collectivité.
UPDATE public.demarche_document_definition
SET expr_applicable = 'identite(population, plus_de_45000)',
    description     = 'Attendu des collectivités de plus de 45 000 habitants.',
    modified_at     = now()
WHERE id = 'pcaet_plan_chaleur_froid';

COMMIT;
