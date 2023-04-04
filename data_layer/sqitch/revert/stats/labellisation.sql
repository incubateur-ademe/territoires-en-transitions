-- Deploy tet:stats/labellisation to pg

BEGIN;

drop materialized view stats_derniere_labellisation;

COMMIT;
