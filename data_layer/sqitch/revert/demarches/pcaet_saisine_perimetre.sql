-- Revert tet:demarches/pcaet_saisine_perimetre from pg

-- La colonne s'en va, et avec elle la distinction. Les saisines secondaires
-- redeviennent des saisines comme les autres : elles attendront de nouveau des
-- avis que personne ne rendra. C'est l'état d'avant, assumé le temps d'un revert.

BEGIN;

ALTER TABLE public.demarche_pcaet_demande_avis
    DROP COLUMN IF EXISTS perimetre;

COMMENT ON COLUMN public.demarche_pcaet_demande_avis.instructeur_collectivite_id IS
    'La collectivité destinataire de la transmission — DREAL, conseil régional, DDT, DR ADEME ou service national (trigger). Seuls la DREAL et le conseil régional sont saisis pour avis ; les autres reçoivent le dossier en lecture.';

COMMIT;
