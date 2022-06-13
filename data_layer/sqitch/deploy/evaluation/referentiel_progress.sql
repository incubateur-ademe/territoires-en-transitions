-- Deploy tet:evaluation/referentiel_progress to pg
-- requires: evaluation/score_summary

BEGIN;

create function private.referentiel_progress(collectivite_id integer)
    returns table
            (
                referentiel     referentiel,
                score_fait      double precision,
                score_programme double precision,
                completude      double precision,
                complet         boolean,
                concerne        boolean
            )
as
$$
with ref as (select unnest(enum_range(null::referentiel)) as referentiel),
     scores as (select s.*
                from ref
                         left join client_scores cs on cs.referentiel = ref.referentiel
                         join private.convert_client_scores(cs.scores) s on true
                where cs.collectivite_id = referentiel_progress.collectivite_id)
select s.referentiel,
       ss.proportion_fait,
       ss.proportion_programme,
       ss.completude,
       ss.complete,
       ss.concerne
from scores s
         join private.score_summary_of(s) ss on true
where s.action_id = s.referentiel::action_id;
$$ language sql stable;
comment on function private.referentiel_progress is
    'Les progrès d''une collectivité par référentiel.';

COMMIT;
