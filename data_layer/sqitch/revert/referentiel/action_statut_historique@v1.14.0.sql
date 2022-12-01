-- Revert tet:referentiel/action_statut_history from pg

BEGIN;

drop trigger save_history on action_statut;
drop function historique.save_action_statut;
drop table historique.action_statut;

COMMIT;
