-- Verify tet:history_schema on pg

BEGIN;

comment on schema historique is null;

ROLLBACK;
