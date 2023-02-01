-- Verify tet:labellisation/fichier_preuve on pg

BEGIN;

select has_function_privilege('update_bibliotheque_fichier_filename(integer, varchar(64), text)', 'execute');

ROLLBACK;
