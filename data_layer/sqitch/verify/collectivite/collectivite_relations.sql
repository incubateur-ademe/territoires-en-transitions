-- Verify tet:collectivite/collectivite_relations on pg

BEGIN;

select id, parent_id
from collectivite_relations
where false;

ROLLBACK;
