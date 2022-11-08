-- Verify tet:utils/maintenance on pg

BEGIN;

select id, begins_at, ends_at
from maintenance
where false;

ROLLBACK;
