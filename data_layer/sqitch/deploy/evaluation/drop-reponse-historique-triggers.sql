-- Deploy tet:evaluation/drop-reponse-historique-triggers to pg

BEGIN;

DROP TRIGGER IF EXISTS save_history ON reponse_binaire;
DROP TRIGGER IF EXISTS save_history ON reponse_choix;
DROP TRIGGER IF EXISTS save_history ON reponse_proportion;
DROP TRIGGER IF EXISTS save_history ON justification;

DROP TRIGGER IF EXISTS set_modified_at_before_reponse_binaire_update ON reponse_binaire;
DROP TRIGGER IF EXISTS set_modified_at_before_reponse_choix_update ON reponse_choix;
DROP TRIGGER IF EXISTS set_modified_at_before_reponse_proportion_update ON reponse_proportion;

DROP FUNCTION IF EXISTS historique.save_reponse_binaire();
DROP FUNCTION IF EXISTS historique.save_reponse_choix();
DROP FUNCTION IF EXISTS historique.save_reponse_proportion();
DROP FUNCTION IF EXISTS historique.save_justification();

COMMIT;
