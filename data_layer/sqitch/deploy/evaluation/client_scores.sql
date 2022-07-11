-- Deploy tet:client_scores to pg
-- requires: referentiel
-- requires: base

BEGIN;

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

alter publication supabase_realtime add table client_scores;

COMMIT;
