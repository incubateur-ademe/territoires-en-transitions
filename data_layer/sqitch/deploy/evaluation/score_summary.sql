-- Deploy tet:evaluation/score_summary to pg
-- requires: evaluation/client_scores

BEGIN;

create or replace function
    private.convert_client_scores(scores jsonb)
    returns setof private.action_score
as
$$
select (select referentiel from action_relation ar where ar.id = (score ->> 'action_id')),
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
$$ language sql stable ;
comment on function private.convert_client_scores is
    'Convert json data from business to typed scores.';

COMMIT;
