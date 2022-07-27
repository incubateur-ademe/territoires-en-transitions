-- Revert tet:labellisation/fichier_preuve from pg

BEGIN;

drop function labellisation.critere_fichier(collectivite_id integer);
drop trigger remove_labellisation_preuve_fichier_before_file_delete on storage.objects;
drop function remove_labellisation_preuve_fichier();
drop view action_labellisation_preuve_fichier;
drop function delete_labellisation_preuve_fichier(collectivite_id integer, demande_id integer, filename text);
drop function upsert_labellisation_preuve_fichier(collectivite_id integer, demande_id integer, filename text, commentaire text);
drop table labellisation_preuve_fichier;

COMMIT;
