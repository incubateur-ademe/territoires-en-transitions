-- Deploy tet:demarche/statut_instruit to pg
-- requires: demarche/statut_publication_fusionne

BEGIN;

-- L'instruction devient un jalon du cycle de vie. `instruit` est le seul statut
-- que la collectivité n'atteint pas elle-même : le dossier y bascule quand les
-- avis attendus sont rendus, ou quand le délai légal est échu (transitions
-- `avis_tous_rendus` et `delai_avis_echu`, sans acteur). C'est l'étape où le
-- dépôt se finalise — les pièces aval s'y déposent.
--
-- `adopte` disparaît au profit de `publie` : adopter et mettre à disposition du
-- public sont désormais un seul acte, et c'est le dépôt de la délibération
-- d'adoption qui l'autorise. Les dossiers déjà adoptés deviennent donc publiés.
ALTER TABLE public.demarche DROP CONSTRAINT demarche_status_check;

UPDATE public.demarche
SET status = 'publie'
WHERE type = 'pcaet' AND status = 'adopte';

ALTER TABLE public.demarche ADD CONSTRAINT demarche_status_check CHECK (
    type = 'pcaet' AND status IN (
    'en_elaboration', 'transmis_pour_avis', 'instruit', 'publie', 'archive'));

COMMENT ON COLUMN public.demarche.status IS
    'Cycle de vie du dépôt, propre au type. PCAET : en_elaboration → transmis_pour_avis (préfet de région, conseil régional, MRAe) → instruit (avis rendus ou délai échu ; finalisation du dépôt) → publie (adopté et mis à disposition du public, mise en œuvre 6 ans) → archive. Transitions gérées par le domaine demarches.';

COMMIT;
