-- Verify tet:retool/collectivite on pg

BEGIN;

select collectivite_id, nom
from retool_active_collectivite
where false;

ROLLBACK;
