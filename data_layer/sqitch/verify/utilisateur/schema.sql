-- Verify tet:utilisateur/schema on pg

BEGIN;

select pg_catalog.has_schema_privilege('utilisateur', 'usage');

ROLLBACK;
