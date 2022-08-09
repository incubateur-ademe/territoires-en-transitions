-- Revert tet:referentiel/action_precision_history from pg

BEGIN;

drop view historical_action_precision;
drop trigger save_history on action_commentaire;
drop function history.save_action_precision;
drop table history.action_precision;

COMMIT;
