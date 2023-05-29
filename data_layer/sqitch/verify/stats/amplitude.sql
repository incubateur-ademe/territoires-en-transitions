-- Verify tet:stats/amplitude on pg

BEGIN;

select has_function_privilege('stats.amplitude_registered(tstzrange)', 'execute');
select has_function_privilege('stats.amplitude_events(tstzrange)', 'execute');
select has_function_privilege('stats.amplitude_visite(tstzrange)', 'execute');
select has_function_privilege('stats.amplitude_send_events(tstzrange, integer)', 'execute');
select has_function_privilege('stats.amplitude_send_yesterday_events()', 'execute');

ROLLBACK;
