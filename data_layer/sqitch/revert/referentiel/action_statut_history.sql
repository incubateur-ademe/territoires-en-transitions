-- Revert tet:referentiel/action_statut_history from pg

BEGIN;

drop view historical_action_statut;
drop trigger save_history on action_statut;
drop function history.save_action_statut;
drop table history.action_statut;

COMMIT;
