-- Deploy tet:utils/maintenance to pg

BEGIN;

DROP VIEW IF EXISTS ongoing_maintenance;
DROP TABLE IF EXISTS maintenance;

COMMIT;
