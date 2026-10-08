-- Deploy tet:demarche/pcaet_plan_actions_inclusion_declaree to pg
-- requires: demarche/pcaet_deliberation_arret_revisable

BEGIN;

-- Le programme d'actions déposé à part est importé dans la plateforme pour en
-- faire le plan structuré de l'étape Programme d'actions : on pousse à le
-- déposer. Le dépôt du PCAET global ne coche donc plus son inclusion d'office ;
-- la collectivité la déclare si elle s'en tient au global. Les inclusions déjà
-- enregistrées restent : ce sont des déclarations, la collectivité les décoche.
UPDATE public.demarche_document_substitution
SET automatic = false
WHERE document_id = 'pcaet_plan_actions'
  AND substitut_id = 'pcaet_document_global';

COMMIT;
