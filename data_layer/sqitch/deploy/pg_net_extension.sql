-- Deploy tet:pg_net_extension to pg

BEGIN;

create extension if not exists pg_net;

COMMIT;
