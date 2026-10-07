-- Revert tet:drop_pg_net from pg

BEGIN;

create extension if not exists pg_net;

COMMIT;
