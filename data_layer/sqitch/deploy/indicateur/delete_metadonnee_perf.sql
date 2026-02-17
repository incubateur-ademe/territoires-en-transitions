-- Deploy tet:indicateur/delete_metadonnee_perf to pg
-- Améliore les performances des DELETE sur indicateur_source_metadonnee en ajoutant
-- un index manquant pour la vérification des contraintes FK

BEGIN;

CREATE INDEX IF NOT EXISTS idx_indicateur_valeur_metadonnee_id
    ON indicateur_valeur (metadonnee_id)
    WHERE metadonnee_id IS NOT NULL;

COMMIT;
