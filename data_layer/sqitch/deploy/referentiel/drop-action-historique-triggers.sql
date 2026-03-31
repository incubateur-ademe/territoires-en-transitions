-- Deploy tet:referentiel/drop-action-historique-triggers to pg

BEGIN;

DROP TRIGGER IF EXISTS save_history ON action_statut;
DROP TRIGGER IF EXISTS save_history ON action_commentaire;
DROP FUNCTION IF EXISTS historique.save_action_statut();
DROP FUNCTION IF EXISTS historique.save_action_precision();
DROP FUNCTION IF EXISTS private.move_action_data(a action_id, b action_id);

COMMIT;
