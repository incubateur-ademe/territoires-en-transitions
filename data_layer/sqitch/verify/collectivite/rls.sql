-- Verify tet:collectivite/rls on pg

BEGIN;

select 1/count(*) from pg_catalog.pg_tables where tablename = 'filtre_intervalle' and rowsecurity;

ROLLBACK;
