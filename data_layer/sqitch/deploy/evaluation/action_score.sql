-- Deploy tet:evaluation/action_score to pg

BEGIN;

create function
    private.action_score(collectivite_id integer, referentiel referentiel)
    returns setof private.action_score
as
$$
select (private.convert_client_scores(cs.scores)).*
from client_scores cs
where cs.collectivite_id = action_score.collectivite_id
  and cs.referentiel = action_score.referentiel
$$ language sql;

COMMIT;
