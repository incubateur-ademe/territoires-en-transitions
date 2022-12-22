-- Deploy tet:timescaledb to pg

BEGIN;

create extension if not exists timescaledb;

COMMIT;
