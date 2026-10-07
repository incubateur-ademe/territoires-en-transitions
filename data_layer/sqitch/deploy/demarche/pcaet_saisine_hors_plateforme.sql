-- Deploy tet:demarche/pcaet_saisine_hors_plateforme to pg
-- requires: demarche/pcaet_depot_hors_plateforme
-- requires: demarches/pcaet_avis

BEGIN;

-- Un dépôt hors plateforme saisit lui aussi les services qui couvrent la
-- collectivité — DREAL, DDT, région, DR ADEME, service national — pour qu'ils
-- voient le dossier dans leur liste.
--
-- La provenance les distingue d'une transmission : ces saisines n'appellent
-- aucun avis (le statut `instruit_hors_plateforme` ferme le dépôt d'avis par
-- construction) et n'ont donné lieu à aucune notification, les services ayant
-- été saisis en dehors de la plateforme.
ALTER TABLE public.demarche_pcaet_demande_avis
    DROP CONSTRAINT demarche_pcaet_demande_avis_source_check;

ALTER TABLE public.demarche_pcaet_demande_avis
    ADD CONSTRAINT demarche_pcaet_demande_avis_source_check
    CHECK (source IN ('seed', 'transmission', 'depot_hors_plateforme'));

COMMENT ON COLUMN public.demarche_pcaet_demande_avis.source IS
    'seed | transmission | depot_hors_plateforme — provenance de la saisine. depot_hors_plateforme : le dossier a été instruit en dehors de la plateforme, la saisine ne sert qu''à le rendre visible au service, sans avis attendu ni notification envoyée.';

COMMIT;
