-- Deploy tet:demarche/pcaet_deliberation_arret_revisable to pg
-- requires: demarche/pcaet_ees_absorbe_etude_impact

BEGIN;

-- La délibération d'arrêt se reprend après les avis, comme le reste du fond du
-- dossier : la collectivité peut y répondre par une version dédiée, notamment
-- quand elle l'avait déclarée comprise dans le PCAET global. La version
-- transmise reste celle qui a été instruite.
UPDATE public.demarche_document_definition
SET etape       = 'both',
    modified_at = now()
WHERE id = 'pcaet_deliberation_arret';

COMMIT;
