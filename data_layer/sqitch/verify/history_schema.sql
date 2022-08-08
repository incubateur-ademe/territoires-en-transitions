-- Verify tet:history_schema on pg

BEGIN;

comment on schema history is null;

ROLLBACK;
