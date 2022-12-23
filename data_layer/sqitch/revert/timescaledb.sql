-- Revert tet:timescaledb from pg

BEGIN;

drop extension if exists timescaledb;

COMMIT;
