-- Verify tet:stats/posthog on pg

BEGIN;

select has_function_privilege('posthog.validate_event(jsonb)', 'execute');
select has_function_privilege('posthog.event(tstzrange)', 'execute');
select has_function_privilege('posthog.event(posthog.latest_score_modification)', 'execute');
select has_function_privilege('posthog.creation_event(dcp)', 'execute');

select collectivite_id, referentiel, time
from posthog.latest_score_modification
where false;

ROLLBACK;
