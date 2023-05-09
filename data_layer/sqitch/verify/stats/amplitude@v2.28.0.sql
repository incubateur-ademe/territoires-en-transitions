-- Verify tet:stats/amplitude on pg

BEGIN;

select id, api_url, api_key
from stats.amplitude_configuration
where false;

select name, time
from stats.release_version
where false;

select has_function_privilege('stats.amplitude_visite(tstzrange)', 'execute');
select has_function_privilege('stats.amplitude_send_visites(tstzrange, integer)', 'execute');
select has_function_privilege('stats.amplitude_send_yesterday_events()', 'execute');

ROLLBACK;
