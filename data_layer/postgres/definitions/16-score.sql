--------------------------------
----------- SCORE --------------
--------------------------------
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
with
    -- equivalent to active collectivite
    unique_collectivite_droit as (
        select named_collectivite.collectivite_id, min(created_at) as max_date
        from named_collectivite
                 join private_utilisateur_droit
                      on named_collectivite.collectivite_id = private_utilisateur_droit.collectivite_id
        where private_utilisateur_droit.active
        group by named_collectivite.collectivite_id
    ),
    -- virtual events, so we consider someone joining a collectivite as a statuts update
    virtual_inital_event as (
        select collectivite_id,
               unnest('{eci, cae}'::referentiel[]) as referentiel,
               max_date
        from unique_collectivite_droit
    ),
    -- the latest from virtual and action statut update event
    latest_event as (
        select v.collectivite_id,
               v.referentiel,
               max(coalesce(v.max_date, r.created_at)) as max_date
        from virtual_inital_event v
                 full join action_statut_update_event r on r.collectivite_id = v.collectivite_id
        group by v.collectivite_id, v.referentiel
    ),
    -- events that are not processed
    unprocessed as (
        select *
        from latest_event e
        where collectivite_id not in (
            -- processed means that the score is more recent than the event
            select collectivite_id
            from client_scores s
            where s.score_created_at > e.max_date
        )
    )
select unprocessed.collectivite_id,
       unprocessed.referentiel,
       unprocessed.max_date as created_at
from unprocessed
;
comment on view unprocessed_action_statut_update_event is
    'To be used by business to compute only what is necessary.';


