-- Revert tet:evaluation/reponse from pg

BEGIN;

drop function save_reponse(json);
drop view reponse_display;
drop view business_reponse;
drop table reponse_proportion;
drop table reponse_binaire;
drop table reponse_choix;

COMMIT;
