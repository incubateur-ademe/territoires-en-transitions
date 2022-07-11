-- Revert tet:referentiel/preuve from pg

BEGIN;

drop view preuve;
drop table preuve_lien;
drop trigger remove_preuve_fichier_before_file_delete on storage.objects;
drop function remove_preuve_fichier();
drop view action_preuve_fichier;
drop function delete_preuve_fichier(collectivite_id integer, action_id action_id, filename text);
drop function upsert_preuve_fichier(collectivite_id integer, action_id action_id, filename text, commentaire text);
drop trigger after_collectivite_write on collectivite;
drop function after_collectivite_insert_create_bucket();
drop table preuve_fichier;

COMMIT;
