-- Revert tet:demarche/statut_instruit from pg

BEGIN;

ALTER TABLE public.demarche DROP CONSTRAINT demarche_status_check;

-- Un dossier instruit n'a pas d'équivalent dans l'ancien cycle : il retourne au
-- statut d'où il venait, la transmission pour avis. Les dossiers publiés, eux,
-- restent publiés — le revert ne peut pas distinguer ceux qui étaient adoptés
-- avant le déploiement de ceux publiés depuis.
UPDATE public.demarche
SET status = 'transmis_pour_avis'
WHERE type = 'pcaet' AND status = 'instruit';

ALTER TABLE public.demarche ADD CONSTRAINT demarche_status_check CHECK (
    type = 'pcaet' AND status IN (
    'en_elaboration', 'transmis_pour_avis', 'adopte', 'publie', 'archive'));

COMMENT ON COLUMN public.demarche.status IS
    'Cycle de vie du dépôt, propre au type. PCAET : en_elaboration → transmis_pour_avis (préfet de région, conseil régional, MRAe) → adopte (mise en œuvre 6 ans) → publie (mise à disposition du public) → archive. Transitions gérées par le domaine demarches.';

COMMIT;
