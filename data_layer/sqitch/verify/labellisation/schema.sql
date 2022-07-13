-- Verify tet:labellisation/schema on pg

BEGIN;

select pg_catalog.has_schema_privilege('labellisation', 'usage');

ROLLBACK;
