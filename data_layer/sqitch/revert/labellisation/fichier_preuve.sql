-- Deploy tet:labellisation/fichier_preuve to pg
-- requires: labellisation/labellisation
-- requires: collectivite/bucket

BEGIN;

drop function update_bibliotheque_fichier_filename;

COMMIT;
