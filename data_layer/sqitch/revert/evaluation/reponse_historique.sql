-- Revert tet:evaluation/reponse_history from pg

BEGIN;

drop view historique.reponse_display;

drop view historique.reponse_choix_display;
drop trigger save_history on reponse_choix;
drop function historique.save_reponse_choix();
drop table historique.reponse_choix;

drop view historique.reponse_proportion_display;
drop trigger save_history on reponse_proportion;
drop function historique.save_reponse_proportion();
drop table historique.reponse_proportion;

drop view historique.reponse_binaire_display;
drop trigger save_history on reponse_binaire;
drop function historique.save_reponse_binaire();
drop table historique.reponse_binaire;

COMMIT;
