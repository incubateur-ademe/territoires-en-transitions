-- Verify tet:stats/amplitude on pg

BEGIN;

select has_function_privilege('stats.amplitude_send_visites(tstzrange, integer)', 'execute');

ROLLBACK;
