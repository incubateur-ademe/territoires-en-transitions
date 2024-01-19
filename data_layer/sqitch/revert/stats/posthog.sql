-- Deploy tet:stats/posthog to pg

BEGIN;

drop function posthog.validate_event(jsonb);

create or replace function
    posthog.event(tstzrange)
    returns setof jsonb
    language sql
    stable
    security definer
begin
    atomic
    select to_jsonb(posthog.event(v))
    from visite v
    where $1 @> time
    union all
    select to_jsonb(posthog.event(u))
    from usage u
    where $1 @> time
    union all
    select to_jsonb(posthog.event(e))
    from posthog.modification e
    where $1 @> time
    union all
    select to_jsonb(posthog.event(e))
    from posthog.creation e
    where $1 @> time;
end;

drop function posthog.event(posthog.latest_score_modification);
drop view posthog.latest_score_modification;
drop function posthog.creation_event(dcp);

COMMIT;
