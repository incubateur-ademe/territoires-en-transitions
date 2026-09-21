-- Revert tet:demarche/pcaet_ees_absorbe_etude_impact from pg

BEGIN;

-- L'étude d'impact retrouve sa ligne, telle que pcaet_documents_amont l'avait
-- créée. Les dépôts passés à l'EES y restent : rien ne dit lesquels venaient
-- d'elle.
INSERT INTO public.demarche_document_definition
    (id, demarche_type, nom, description, requis, ordre, etape)
VALUES
    ('pcaet_etude_impact', 'pcaet',
     'Étude d''impact (dont résumé non technique)', '',
     true, 9, 'both')
ON CONFLICT (id) DO UPDATE SET
    nom         = excluded.nom,
    requis      = excluded.requis,
    ordre       = excluded.ordre,
    etape       = excluded.etape,
    modified_at = now();

INSERT INTO public.demarche_document_substitution (document_id, substitut_id, automatic)
VALUES ('pcaet_etude_impact', 'pcaet_document_global', false)
ON CONFLICT (document_id, substitut_id) DO UPDATE SET automatic = false;

DELETE FROM public.demarche_document_substitution
WHERE document_id = 'pcaet_ees' AND substitut_id = 'pcaet_document_global';

UPDATE public.demarche_document_definition
SET nom         = 'EES (évaluation environnementale stratégique)',
    requis      = false,
    etape       = 'amont',
    modified_at = now()
WHERE id = 'pcaet_ees';

-- Restaure la chronologie laissée par pcaet_documents_plans_annexes.
UPDATE public.demarche_document_definition AS definition
SET ordre       = attendu.ordre,
    modified_at = now()
FROM (VALUES
    ('pcaet_bilan_pcaet_precedent', 10),
    ('pcaet_deliberation_arret', 11),
    ('pcaet_memoire_reponse_avis', 12),
    ('pcaet_synthese_consultation_publique', 13),
    ('pcaet_deliberation_adoption', 14)
) AS attendu(id, ordre)
WHERE definition.id = attendu.id;

COMMIT;
