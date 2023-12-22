-- Deploy tet:stats/posthog to pg

BEGIN;

create or replace view posthog.creation
as
select 'fiche'         as type,
       created_at      as time,
       modified_by     as user_id,
       collectivite_id as collectivite_id
from fiche_action
         join stats.collectivite_active using (collectivite_id)
where modified_by is not null
union all
select 'plan', created_at, modified_by, collectivite_id
from axe
         join stats.collectivite_active using (collectivite_id)
where parent is null
  and modified_by is not null
union all
select 'discussion', created_at, created_by, collectivite_id
from action_discussion;

COMMIT;
