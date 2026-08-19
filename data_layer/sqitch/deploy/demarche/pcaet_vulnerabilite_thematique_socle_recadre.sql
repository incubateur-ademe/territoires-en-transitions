-- Deploy tet:demarche/pcaet_vulnerabilite_thematique_socle_recadre to pg
-- requires: demarche/pcaet_vulnerabilite_thematique

BEGIN;

-- La liste indicative du cadre de dépôt (16 thématiques) s'est révélée trop
-- large à l'usage : le socle est recadré sur les 9 thématiques retenues par
-- le proto. Les valeurs déjà saisies pour les thématiques retirées sont
-- perdues (ON DELETE CASCADE) — la fonctionnalité reste derrière son flag.
DELETE FROM public.demarche_pcaet_vulnerabilite_thematique
WHERE collectivite_id IS NULL
  AND code IN (
    'dechets', 'espaces_verts', 'industrie', 'littoral', 'residentiel',
    'securite_civile', 'tertiaire', 'tourisme', 'transport'
  );

-- Rejouable comme l'INSERT d'origine : les codes conservés voient leur
-- libellé raccourci et leur ordre resserré, batiments et economie
-- rejoignent le socle.
INSERT INTO public.demarche_pcaet_vulnerabilite_thematique
    (code, label, collectivite_id, requis, display_order)
VALUES
    ('agriculture',  'Agriculture',  NULL, true, 1),
    ('amenagement',  'Aménagement',  NULL, true, 2),
    ('batiments',    'Bâtiments',    NULL, true, 3),
    ('biodiversite', 'Biodiversité', NULL, true, 4),
    ('eau',          'Eau',          NULL, true, 5),
    ('foret',        'Forêt',        NULL, true, 6),
    ('energie',      'Énergie',      NULL, true, 7),
    ('economie',     'Économie',     NULL, true, 8),
    ('sante',        'Santé',        NULL, true, 9)
ON CONFLICT (code) WHERE collectivite_id IS NULL DO UPDATE
    SET label         = EXCLUDED.label,
        requis        = EXCLUDED.requis,
        display_order = EXCLUDED.display_order,
        modified_at   = now();

COMMIT;
