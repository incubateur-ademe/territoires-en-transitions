-- Deploy tet:referentiel/clean_vues_rpc to pg

BEGIN;

DROP FUNCTION update_bibliotheque_fichier_filename(integer, varchar, text);
DROP FUNCTION update_bibliotheque_fichier_confidentiel(integer, character varying, boolean);
DROP FUNCTION labellisation_peut_commencer_audit(integer, referentiel);

COMMIT;
