--------------------------------
----------- SCORE --------------
--------------------------------
create table score
(
    -- id                     serial primary key,
    collectivite_id        integer references collectivite        not null,
    action_id              action_id references action_relation   not null,
    points                 real                                   not null,
    potentiel              real                                   not null,
    referentiel_points     real                                   not null,
    concerne               bool                                   not null,
    previsionnel           real                                   not null,
    total_taches_count     int                                    not null,
    completed_taches_count int                                    not null,
    created_at             timestamp with time zone default Now() not null,
    primary key (collectivite_id, action_id)
);

comment on table score is 'Score data is created by the business';
comment on column score.created_at is
    'Used to group scores in batches because rows created during a transaction have the same values';

create table client_scores
(
    -- id               serial primary key,
    collectivite_id  integer references collectivite not null,
    referentiel      referentiel                     not null,
    scores           jsonb                           not null,
    score_created_at timestamp with time zone        not null,
    primary key (collectivite_id, referentiel)
);
comment on table client_scores is 'Client score data is generated from score on trigger';
comment on column client_scores.score_created_at is 'Equal score.created_at.';


create or replace function
    get_score_batches_for_epci(
    collectivite_id integer
)
    returns table
            (
                collectivite_id int,
                referentiel     referentiel,
                scores          jsonb,
                created_at      timestamptz
            )
as
$$
select score.collectivite_id,
       action_relation.referentiel,
       jsonb_agg(
               jsonb_build_object(
                       'action_id', action_id,
                       'points', points,
                       'potentiel', potentiel,
                       'referentiel', action_relation.referentiel,
                       'referentiel_points', referentiel_points,
                       'concerne', concerne,
                       'previsionnel', previsionnel,
                       'total_taches_count', total_taches_count,
                       'completed_taches_count', completed_taches_count
                   )
           ) as scores,
       created_at
from score
         join action_relation on
        action_id = action_relation.id
where score.collectivite_id = $1
group by score.collectivite_id, action_relation.referentiel, created_at;
$$ language sql;


create or replace function
    should_create_client_scores_for_epci(
    collectivite_id integer,
    created timestamp with time zone
) returns bool
as
$$
select count(*) > 0
from score
where score.collectivite_id = $1
  and score.created_at = $2;
$$ language sql;



create or replace function after_score_update_insert_client_scores() returns trigger as
$$
declare
    existingClientScoreCount bool;
begin
    -- find existing client scores
    select should_create_client_scores_for_epci(NEW.collectivite_id, NEW.created_at)
    into existingClientScoreCount;

    if existingClientScoreCount
    then
        -- remove existing client scores
        delete from client_scores where collectivite_id = NEW.collectivite_id;
        -- insert client scores
        insert into client_scores (collectivite_id, referentiel, scores, score_created_at)
        select batches.collectivite_id,
               batches.referentiel,
               batches.scores,
               batches.created_at
        from get_score_batches_for_epci(NEW.collectivite_id) as batches;
    end if;
    return null;
end;
$$ language plpgsql;

create constraint trigger after_score_write
    after update or insert
    on score
    deferrable
        initially deferred
    for each row
execute procedure after_score_update_insert_client_scores();

