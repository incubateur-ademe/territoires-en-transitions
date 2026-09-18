-- Verify tet:demarche/pcaet_saisine_hors_plateforme on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT pg_get_constraintdef(oid) LIKE '%depot_hors_plateforme%'
        FROM pg_constraint
        WHERE conname = 'demarche_pcaet_demande_avis_source_check'
    ), 'La source depot_hors_plateforme doit être acceptée sur demarche_pcaet_demande_avis';
END $$;

ROLLBACK;
