-- Revert tet:evaluation/reactivite from pg

BEGIN;

drop view unprocessed_reponse_update_event;
drop trigger after_reponse_proportion_write on reponse_proportion;
drop trigger after_reponse_binaire_write on reponse_binaire;
drop trigger after_reponse_choix_write on reponse_choix;
drop function after_reponse_insert_write_event;
alter publication supabase_realtime drop table reponse_update_event;
drop table reponse_update_event;

COMMIT;
