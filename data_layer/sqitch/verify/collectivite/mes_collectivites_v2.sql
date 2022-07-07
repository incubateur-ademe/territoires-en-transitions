-- Verify tet:collectivite/mes_collectivites_v2 on pg

BEGIN;

select collectivite_id, nom
from elses_collectivite
where false;

ROLLBACK;
