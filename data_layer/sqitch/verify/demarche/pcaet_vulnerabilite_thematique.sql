-- Verify tet:demarche/pcaet_vulnerabilite_thematique on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT to_regclass('public.demarche_pcaet_vulnerabilite_thematique') IS NOT NULL
    ), 'La table des thématiques de vulnérabilité doit exister sous son nouveau nom';

    ASSERT (
        SELECT to_regclass('public.demarche_pcaet_vulnerabilite_domaine') IS NULL
    ), 'L''ancien nom de la table des thématiques ne doit plus exister';

    ASSERT (
        SELECT COUNT(*) = 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'demarche_pcaet_vulnerabilite_valeur'
          AND column_name = 'thematique_id'
    ), 'La saisie doit référencer la thématique, plus le domaine';

    -- Renommage pur : le socle est là, au complet — les 16 domaines d'origine.
    -- Le recadrage à 9 est le changement suivant, il a son propre verify.
    ASSERT (
        SELECT COUNT(*) = 16
        FROM public.demarche_pcaet_vulnerabilite_thematique
        WHERE collectivite_id IS NULL
    ), 'Les 16 thématiques du socle doivent avoir survécu au renommage';

    -- Contraintes et index suivent le nom de la table : un dump relu ne doit
    -- pas ressusciter le vocabulaire d'avant.
    ASSERT (
        SELECT COUNT(*) = 0
        FROM pg_constraint
        WHERE conrelid::regclass::text LIKE 'demarche_pcaet_vulnerabilite%'
          AND conname LIKE '%domaine%'
    ), 'Aucune contrainte de la vulnérabilité ne doit garder l''ancien nom';

    ASSERT (
        SELECT COUNT(*) = 3
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname IN ('demarche_pcaet_vulnerabilite_thematique_code_key',
                            'demarche_pcaet_vulnerabilite_thematique_collectivite_label_key',
                            'demarche_pcaet_vulnerabilite_valeur_thematique_id_idx')
    ), 'Les index doivent suivre le renommage';
END $$;

ROLLBACK;
