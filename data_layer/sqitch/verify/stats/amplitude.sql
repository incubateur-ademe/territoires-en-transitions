-- Verify tet:stats/amplitude on pg

BEGIN;

select has_function_privilege('stats.amplitude_send_events(stats.amplitude_event[], tstzrange, integer)', 'execute');
select has_function_privilege('stats.amplitude_send_yesterday_events()', 'execute');
select has_function_privilege('stats.amplitude_build_crud_events(stats.amplitude_content_event[], text, stats.amplitude_crud_type)', 'execute');
select has_function_privilege('stats.amplitude_send_yesterday_creations()', 'execute');

ROLLBACK;
