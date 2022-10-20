-- Verify tet:labellisation/fichier_preuve on pg

BEGIN;

select *
from labellisation.bibliotheque_fichier
where false;

select *
from bibliotheque_fichier
where false;

select has_function_privilege('add_bibliotheque_fichier(integer, varchar(64), text)', 'execute');

ROLLBACK;
