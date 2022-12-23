-- Verify tet:timescaledb on pg

BEGIN;

select has_function_privilege('create_hypertable(regclass, name, name, integer, name, name, anyelement, boolean, boolean, regproc, boolean, text, regproc, regproc, integer, name[])', 'execute');

ROLLBACK;
