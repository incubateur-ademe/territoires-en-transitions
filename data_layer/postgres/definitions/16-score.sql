--------------------------------
----------- SCORE --------------
--------------------------------
create table client_scores
(
    -- id               serial primary key,
    collectivite_id  integer references collectivite not null,
    referentiel      referentiel                     not null,
    scores           jsonb                            not null,
    score_created_at timestamp with time zone        not null,
    primary key (collectivite_id, referentiel)
);
comment on table client_scores is 'Client score data is generated from score on trigger';
comment on column client_scores.score_created_at is 'Equal score.created_at.';

-- todo make RLS work with realtime
-- alter table client_scores
--     enable row level security;
--
-- create policy allow_read
--     on client_scores
--     for select
--     using (is_authenticated());


--------------------------------
---------- PROCESSING ----------
--------------------------------
create or replace view unprocessed_action_statut_update_event
as
with latest_score as (
    select collectivite_id, referentiel, max(score_created_at) as max_date
    from client_scores
    group by collectivite_id, referentiel
),
     latest_event as (
         select collectivite_id, referentiel, max(created_at) as max_date
         from action_statut_update_event
         group by collectivite_id, referentiel
     )
select latest_event.collectivite_id, latest_event.referentiel, latest_event.max_date as created_at
from latest_event
 full join latest_score on latest_event.referentiel = latest_score.referentiel
 and latest_event.collectivite_id = latest_score.collectivite_id
  where latest_event.max_date > latest_score.max_date or  latest_score.max_date is null;

comment on view unprocessed_action_statut_update_event is
    'To be used by business to compute only what is necessary.';


