-- Revert tet:demarche/pcaet_vulnerabilite_transport from pg

BEGIN;

-- Les niveaux et objectifs saisis sur cette thématique partent avec elle
-- (ON DELETE CASCADE sur demarche_pcaet_vulnerabilite_valeur), comme pour les
-- thématiques retirées par le recadrage du socle.
DELETE FROM public.demarche_pcaet_vulnerabilite_thematique
WHERE collectivite_id IS NULL
  AND code = 'transport';

COMMIT;
