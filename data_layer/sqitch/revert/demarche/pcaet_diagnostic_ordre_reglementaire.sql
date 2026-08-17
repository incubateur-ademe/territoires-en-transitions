-- Revert tet:demarche/pcaet_diagnostic_ordre_reglementaire from pg

BEGIN;

UPDATE public.demarche_pcaet_topic
SET display_order = 2,
    modified_at   = now()
WHERE code = 'consommation_energetique';

UPDATE public.demarche_pcaet_topic
SET display_order = 4,
    modified_at   = now()
WHERE code = 'polluants_atmospheriques';

UPDATE public.demarche_pcaet_topic
SET label       = 'Profil énergie climat',
    modified_at = now()
WHERE code = 'profil_energie_climat';

COMMIT;
