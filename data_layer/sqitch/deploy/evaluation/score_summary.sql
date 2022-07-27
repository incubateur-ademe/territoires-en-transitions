-- Deploy tet:evaluation/score_summary to pg
-- requires: evaluation/client_scores

BEGIN;

create table private.action_score
(
    referentiel                    referentiel not null,
    action_id                      action_id   not null,
    concerne                       boolean     not null default true,
    desactive                      boolean     not null default false,
    point_fait                     float       not null default .0,
    point_pas_fait                 float       not null default .0,
    point_potentiel                float       not null default .0,
    point_programme                float       not null default .0,
    point_referentiel              float       not null default .0,
    total_taches_count             float       not null default .0,
    point_non_renseigne            float       not null default .0,
    point_potentiel_perso          float                default .0,
    completed_taches_count         float       not null default .0,
    fait_taches_avancement         float       not null default .0,
    pas_fait_taches_avancement     float       not null default .0,
    programme_taches_avancement    float       not null default .0,
    pas_concerne_taches_avancement float       not null default .0
);
comment on table private.action_score is
    'A score related to an action. Used for typing, not storing actual data.';

create function
    private.convert_client_scores(scores jsonb)
    returns setof private.action_score
as
$$
select (score ->> 'referentiel')::referentiel,
       (score ->> 'action_id')::action_id,
       (score ->> 'concerne')::boolean,
       (score ->> 'desactive')::boolean,
       (score ->> 'point_fait')::float,
       (score ->> 'point_pas_fait')::float,
       (score ->> 'point_potentiel')::float,
       (score ->> 'point_programme')::float,
       (score ->> 'point_referentiel')::float,
       (score ->> 'total_taches_count')::integer,
       (score ->> 'point_non_renseigne')::float,
       (score ->> 'point_potentiel_perso')::float,
       (score ->> 'completed_taches_count')::integer,
       (score ->> 'fait_taches_avancement')::float,
       (score ->> 'pas_fait_taches_avancement')::float,
       (score ->> 'programme_taches_avancement')::float,
       (score ->> 'pas_concerne_taches_avancement')::float
from jsonb_array_elements(scores) as score
$$ language sql;
comment on function private.convert_client_scores is
    'Convert json data from business to typed scores.';

create function
    private.score_summary_of(score private.action_score)
    returns table
            (
                referentiel          referentiel,
                action_id            action_id,
                proportion_fait      float,
                proportion_programme float,
                completude           float,
                complete             boolean,
                concerne             boolean,
                desactive               boolean
            )
as
$$
select score.referentiel,
       score.action_id,
       case
           when (score.point_potentiel)::float = 0.0
               then (score.fait_taches_avancement)::float / (score.total_taches_count)::float
           else (score.point_fait)::float / (score.point_potentiel)::float
           end,
       case
           when (score.point_potentiel)::float = 0.0
               then (score.programme_taches_avancement)::float / (score.total_taches_count)::float
           else (score.point_programme)::float / (score.point_potentiel)::float
           end,
       case
           when (score.total_taches_count)::float = 0.0 then 0.0
           else (score.completed_taches_count)::float / (score.total_taches_count)::float
           end,
       (score.completed_taches_count)::float = (score.total_taches_count)::float,
       (score.concerne)::boolean,
       (score.desactive)::boolean
$$
    language sql stable;
comment on function private.score_summary_of is
    'Fonction utilitaire pour obtenir un résumé d''un score donné.';

COMMIT;
