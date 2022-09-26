-- Revert tet:referentiel/action_precision_history from pg

BEGIN;

drop trigger save_history on action_commentaire;
drop function historique.save_action_precision;
drop table historique.action_precision;

COMMIT;
