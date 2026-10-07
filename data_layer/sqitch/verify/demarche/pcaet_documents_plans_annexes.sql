-- Verify tet:demarche/pcaet_documents_plans_annexes on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT count(*) = 15 FROM public.demarche_document_definition
        WHERE demarche_type = 'pcaet'
    ), 'Le catalogue PCAET doit compter 15 pièces';

    -- Chronologie complète : les deux plans suivent le programme d'actions.
    ASSERT (
        SELECT array_agg(id ORDER BY ordre) = ARRAY[
            'pcaet_document_global',
            'pcaet_deliberation_engagement',
            'pcaet_diagnostic',
            'pcaet_strategie_territoriale',
            'pcaet_plan_actions',
            'pcaet_plan_qualite_air',
            'pcaet_plan_chaleur_froid',
            'pcaet_dispositif_suivi_evaluation',
            'pcaet_ees',
            'pcaet_etude_impact',
            'pcaet_bilan_pcaet_precedent',
            'pcaet_deliberation_arret',
            'pcaet_memoire_reponse_avis',
            'pcaet_synthese_consultation_publique',
            'pcaet_deliberation_adoption'
        ]
        FROM public.demarche_document_definition
        WHERE demarche_type = 'pcaet'
    ), 'Les deux plans annexes doivent suivre le programme d''actions';

    -- Requises, révisables après les avis, et conditionnées.
    ASSERT (
        SELECT bool_and(requis AND etape = 'both' AND expr_applicable IS NOT NULL)
        FROM public.demarche_document_definition
        WHERE id IN ('pcaet_plan_qualite_air', 'pcaet_plan_chaleur_froid')
    ), 'Les deux plans doivent être requis, de portée both et conditionnés';

    -- Elles sont les seules pièces conditionnelles du catalogue.
    ASSERT (
        SELECT count(*) = 2 FROM public.demarche_document_definition
        WHERE demarche_type = 'pcaet' AND expr_applicable IS NOT NULL
    ), 'Aucune autre pièce ne doit être devenue conditionnelle';

    -- La case « Inclus dans "Programme d'actions" », déclarée et non d'office.
    ASSERT (
        SELECT count(*) = 2 FROM public.demarche_document_substitution
        WHERE substitut_id = 'pcaet_plan_actions'
          AND document_id IN ('pcaet_plan_qualite_air', 'pcaet_plan_chaleur_froid')
          AND NOT automatic
    ), 'Chaque plan doit pouvoir être déclaré compris dans le programme d''actions';

    -- Un seul substitut chacun : l'écran ne propose qu'une case, et la liste
    -- des substitutions n'est pas ordonnée.
    ASSERT (
        SELECT bool_and(nb = 1) FROM (
            SELECT count(*) AS nb
            FROM public.demarche_document_substitution
            WHERE document_id IN ('pcaet_plan_qualite_air', 'pcaet_plan_chaleur_froid')
            GROUP BY document_id
        ) AS substituts_par_plan
    ), 'Chaque plan ne doit avoir qu''un seul substitut';
END $$;

ROLLBACK;
