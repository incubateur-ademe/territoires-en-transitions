-- Verify tet:evaluation/rls on pg

BEGIN;

select 1/count(*) from pg_catalog.pg_tables where tablename = 'client_scores' and rowsecurity;
select 1/count(*) from pg_catalog.pg_tables where tablename = 'personnalisation_consequence' and rowsecurity;

ROLLBACK;
