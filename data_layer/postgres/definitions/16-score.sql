--------------------------------
----------- SCORE --------------
--------------------------------
create table client_scores
(
    -- id               serial primary key,
    collectivite_id  integer references collectivite not null,
    referentiel      referentiel                     not null,
    scores           json                            not null,
    score_created_at timestamp with time zone        not null,
    primary key (collectivite_id, referentiel)
);
comment on table client_scores is 'Client score data is generated from score on trigger';
comment on column client_scores.score_created_at is 'Equal score.created_at.';

--------------------------------
---------- PROCESSING ----------
--------------------------------
create or replace view unprocessed_action_statut_update_event
as
select action_statut_update_event.collectivite_id, action_statut_update_event.referentiel, max_date as score_created_at
from action_statut_update_event
         join (
    select collectivite_id, max(score_created_at) as max_date
    from client_scores
    group by collectivite_id, referentiel
)
    as latest_epci_score on action_statut_update_event.collectivite_id = latest_epci_score.collectivite_id
where action_statut_update_event.created_at > latest_epci_score.max_date
group by action_statut_update_event.collectivite_id, action_statut_update_event.referentiel, max_date;

comment on view unprocessed_action_statut_update_event is
    'To be used by business to compute only what is necessary.';

