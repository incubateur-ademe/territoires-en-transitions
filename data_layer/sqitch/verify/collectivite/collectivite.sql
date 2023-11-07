-- Verify tet:collectivites on pg

BEGIN;

select collectivite_id, nom, type
from named_collectivite
where false;

ROLLBACK;
