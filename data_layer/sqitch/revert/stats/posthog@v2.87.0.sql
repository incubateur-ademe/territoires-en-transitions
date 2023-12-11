-- Revert tet:stats/posthog from pg

BEGIN;

drop schema posthog cascade;

COMMIT;
