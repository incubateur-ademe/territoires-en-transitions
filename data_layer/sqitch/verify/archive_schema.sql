-- Verify tet:archive_schema on pg

BEGIN;

comment on schema archive is null;

ROLLBACK;
