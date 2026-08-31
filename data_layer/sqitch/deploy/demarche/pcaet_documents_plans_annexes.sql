-- Deploy tet:demarche/pcaet_documents_plans_annexes to pg
-- requires: demarche/demarche_documents_applicabilite

BEGIN;

-- ===========================================================================
-- 1. Le programme d'actions prend deux annexes réglementaires, qui se glissent
--    juste après lui. Les pièces suivantes décalent de deux rangs.
-- ===========================================================================
UPDATE public.demarche_document_definition AS definition
SET ordre       = attendu.ordre,
    modified_at = now()
FROM (VALUES
    ('pcaet_dispositif_suivi_evaluation', 7),
    ('pcaet_ees', 8),
    ('pcaet_etude_impact', 9),
    ('pcaet_bilan_pcaet_precedent', 10),
    ('pcaet_deliberation_arret', 11),
    ('pcaet_memoire_reponse_avis', 12),
    ('pcaet_synthese_consultation_publique', 13),
    ('pcaet_deliberation_adoption', 14)
) AS attendu(id, ordre)
WHERE definition.id = attendu.id;

-- ===========================================================================
-- 2. Deux pièces que le décret n'attend pas de tout le monde : le plan
--    d'actions de qualité de l'air pour les territoires assujettis, le plan
--    local de chaleur et de froid au-delà de 45 000 habitants.
--
--    Portée `both` comme le programme d'actions qu'elles complètent : requises
--    au dépôt, révisables après les avis.
-- ===========================================================================
INSERT INTO public.demarche_document_definition
    (id, demarche_type, nom, description, requis, ordre, etape, expr_applicable)
VALUES
    ('pcaet_plan_qualite_air', 'pcaet',
     'Plan d''actions de qualité de l''air',
     'Attendu des EPCI à fiscalité propre de plus de 100 000 habitants.',
     true, 5, 'both',
     'identite(soustype, epci_a_fiscalite_propre) et identite(population, plus_de_100000)'),
    ('pcaet_plan_chaleur_froid', 'pcaet',
     'Plan local de chaleur et de froid',
     'Attendu des collectivités de plus de 45 000 habitants.',
     true, 6, 'both',
     'identite(population, plus_de_45000)')
ON CONFLICT (id) DO UPDATE SET
    demarche_type   = excluded.demarche_type,
    nom             = excluded.nom,
    description     = excluded.description,
    requis          = excluded.requis,
    ordre           = excluded.ordre,
    etape           = excluded.etape,
    expr_applicable = excluded.expr_applicable,
    modified_at     = now();

-- ===========================================================================
-- 3. Les deux plans peuvent se trouver dans le programme d'actions : la
--    collectivité le déclare, pièce par pièce, comme pour le dispositif de
--    suivi et d'évaluation. Un seul substitut chacun — la liste des
--    substitutions n'est pas ordonnée, et l'écran ne propose qu'une case.
-- ===========================================================================
INSERT INTO public.demarche_document_substitution (document_id, substitut_id, automatic)
VALUES ('pcaet_plan_qualite_air',   'pcaet_plan_actions', false),
       ('pcaet_plan_chaleur_froid', 'pcaet_plan_actions', false)
ON CONFLICT (document_id, substitut_id) DO UPDATE SET automatic = false;

COMMIT;
