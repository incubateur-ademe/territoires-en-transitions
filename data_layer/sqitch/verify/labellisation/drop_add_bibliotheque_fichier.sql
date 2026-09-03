-- Verify tet:labellisation/drop_add_bibliotheque_fichier on pg

BEGIN;

select 1 / (count(*) = 0)::int
from pg_proc
where proname = 'add_bibliotheque_fichier';

ROLLBACK;
