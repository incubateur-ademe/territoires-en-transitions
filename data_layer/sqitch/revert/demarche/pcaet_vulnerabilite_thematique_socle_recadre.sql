-- Revert tet:demarche/pcaet_vulnerabilite_thematique_socle_recadre from pg

BEGIN;

-- Retire les deux thématiques introduites par cette migration.
DELETE FROM public.demarche_pcaet_vulnerabilite_thematique
WHERE collectivite_id IS NULL
  AND code IN ('batiments', 'economie');

-- Restaure le socle des 16 thématiques et leurs libellés d'origine.
INSERT INTO public.demarche_pcaet_vulnerabilite_thematique
    (code, label, collectivite_id, requis, display_order)
VALUES
    ('agriculture',     'Agriculture',                                      NULL, true,  1),
    ('amenagement',     'Aménagement / urbanisme',                          NULL, true,  2),
    ('biodiversite',    'Biodiversité',                                     NULL, true,  3),
    ('dechets',         'Déchets',                                          NULL, true,  4),
    ('eau',             'Eau',                                              NULL, true,  5),
    ('espaces_verts',   'Espaces verts',                                    NULL, true,  6),
    ('foret',           'Forêt',                                            NULL, true,  7),
    ('energie',         'Gestion, production et distribution de l''énergie', NULL, true,  8),
    ('industrie',       'Industrie',                                        NULL, true,  9),
    ('littoral',        'Littoral',                                         NULL, true, 10),
    ('residentiel',     'Résidentiel',                                      NULL, true, 11),
    ('sante',           'Santé',                                            NULL, true, 12),
    ('securite_civile', 'Sécurité civile',                                  NULL, true, 13),
    ('tertiaire',       'Tertiaire',                                        NULL, true, 14),
    ('tourisme',        'Tourisme',                                         NULL, true, 15),
    ('transport',       'Transport',                                        NULL, true, 16)
ON CONFLICT (code) WHERE collectivite_id IS NULL DO UPDATE
    SET label         = EXCLUDED.label,
        requis        = EXCLUDED.requis,
        display_order = EXCLUDED.display_order,
        modified_at   = now();

COMMIT;
