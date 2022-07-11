-- Deploy tet:cron/cron to pg

BEGIN;

create extension if not exists pg_cron;

COMMIT;
