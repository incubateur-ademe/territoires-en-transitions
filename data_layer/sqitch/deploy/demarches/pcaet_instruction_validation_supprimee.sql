-- Deploy tet:demarches/pcaet_instruction_validation_supprimee to pg
-- requires: demarches/pcaet_instruction_validation

BEGIN;

-- Valider le dossier partie par partie n'est pas demandé aux instructeurs : le
-- parcours en trois étapes reste une navigation (documents, diagnostic,
-- programme d'actions), pas une case à cocher. Ce qui fait foi est l'avis
-- rendu, porté par demarche_pcaet_avis.
DROP TABLE public.demarche_pcaet_instruction_validation;

COMMIT;
