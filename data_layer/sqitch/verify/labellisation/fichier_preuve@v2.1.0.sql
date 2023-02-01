-- Verify tet:labellisation/fichier_preuve on pg

BEGIN;

select id, collectivite_id, hash, filename
from labellisation.bibliotheque_fichier
where false;

select id, collectivite_id, hash, filename, bucket_id, file_id, filesize
from bibliotheque_fichier
where false;

select has_function_privilege('add_bibliotheque_fichier(integer, varchar(64), text)', 'execute');

ROLLBACK;
