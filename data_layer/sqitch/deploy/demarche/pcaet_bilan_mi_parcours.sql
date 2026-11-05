-- Deploy tet:demarche/pcaet_bilan_mi_parcours to pg
-- requires: demarche/pcaet_ees_absorbe_etude_impact

BEGIN;

-- ===========================================================================
-- 1. Le bilan à mi-parcours du PCAET qui s'achève est un document distinct de
--    son bilan final. Comme lui, il n'a de sens que pour un renouvellement et
--    ne se trouve dans aucune pièce du dépôt en cours : aucune substitution.
--    Contrairement à lui, il reste facultatif.
-- ===========================================================================
INSERT INTO public.demarche_document_definition
    (id, demarche_type, nom, description, requis, ordre, etape, expr_applicable)
VALUES
    ('pcaet_bilan_mi_parcours_precedent', 'pcaet',
     'Bilan à mi-parcours du PCAET précédent', '',
     false, 2, 'amont', 'demarche(renouvellement)')
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
-- 2. Les bilans du PCAET précédent ouvrent le dossier, avant la délibération
--    d'engagement et le diagnostic : on part de ce qui a été fait.
-- ===========================================================================
UPDATE public.demarche_document_definition AS definition
SET ordre       = attendu.ordre,
    modified_at = now()
FROM (VALUES
    ('pcaet_bilan_pcaet_precedent', 1),
    ('pcaet_bilan_mi_parcours_precedent', 2),
    ('pcaet_deliberation_engagement', 3),
    ('pcaet_diagnostic', 4),
    ('pcaet_strategie_territoriale', 5),
    ('pcaet_plan_actions', 6),
    ('pcaet_plan_qualite_air', 7),
    ('pcaet_plan_chaleur_froid', 8),
    ('pcaet_dispositif_suivi_evaluation', 9),
    ('pcaet_ees', 10),
    ('pcaet_deliberation_arret', 11),
    ('pcaet_memoire_reponse_avis', 12),
    ('pcaet_synthese_consultation_publique', 13),
    ('pcaet_deliberation_adoption', 14)
) AS attendu(id, ordre)
WHERE definition.id = attendu.id;

COMMIT;
