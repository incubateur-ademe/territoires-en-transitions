-- Verify tet:stats/amplitude on pg

BEGIN;

select has_function_privilege('stats.amplitude_send_events(stats.amplitude_event[], tstzrange, integer)', 'execute');
select has_function_privilege('stats.amplitude_send_yesterday_events()', 'execute');

ROLLBACK;
