-- Verify tet:labellisation/cot on pg

BEGIN;

select collectivite_id, actif
from cot
where false;

ROLLBACK;
