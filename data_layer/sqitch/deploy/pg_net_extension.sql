-- Deploy tet:pg_net_extension to pg

BEGIN;

create schema if not exists net;
create extension pg_net with schema net;

COMMIT;
