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
---------- PROCESSING ---------- # TODO : make it work with client_scores. 
--------------------------------
-- create view unprocessed_collectivite_action_statut_update_event
-- as
-- select action_statut_update_event.collectivite_id, referentiel, created_at
-- from action_statut_update_event
--          join (
--     select collectivite_id, max(created_at) as date
--     from score
--     group by collectivite_id
-- )
--     as latest_epci_score on action_statut_update_event.collectivite_id = latest_epci_score.collectivite_id
-- where action_statut_update_event.created_at > latest_epci_score.date;
-- comment on view unprocessed_collectivite_action_statut_update_event is
--     'To be used by business to compute only what is necessary.';
