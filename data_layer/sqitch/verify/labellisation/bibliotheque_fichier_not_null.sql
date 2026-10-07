-- Verify tet:labellisation/bibliotheque_fichier_not_null on pg

BEGIN;

select 1 / (count(*) = 3)::int
from information_schema.columns
where table_schema = 'labellisation'
  and table_name = 'bibliotheque_fichier'
  and column_name in ('collectivite_id', 'hash', 'filename')
  and is_nullable = 'NO';

ROLLBACK;
