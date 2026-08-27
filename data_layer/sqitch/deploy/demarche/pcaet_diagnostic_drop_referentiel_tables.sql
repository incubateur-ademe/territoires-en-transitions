-- Deploy tet:demarche/pcaet_diagnostic_drop_referentiel_tables to pg
-- requires: demarche/pcaet_diagnostic_indicateur_source_metadonnee
-- requires: demarche/pcaet_diagnostic_ordre_reglementaire
-- requires: demarche/pcaet_vulnerabilite_thematique_socle_recadre

BEGIN;

-- Le référentiel d'affichage du diagnostic PCAET vit désormais dans le package
-- domain. Les valeurs restent dans indicateur_valeur (source pcaet-collectivite) ;
-- l'état des années et la photo de transmission ne sont plus persistés.

DROP TABLE IF EXISTS public.demarche_pcaet_diagnostic_snapshot CASCADE;
DROP TABLE IF EXISTS public.demarche_pcaet_diagnostic_state CASCADE;
DROP TABLE IF EXISTS public.demarche_pcaet_topic_row CASCADE;
DROP TABLE IF EXISTS public.demarche_pcaet_topic CASCADE;

COMMIT;
