-- Deploy tet:evaluation/score_service to pg

BEGIN;

create or replace function
    evaluation.evaluation_payload(
    in collectivite_id integer,
    in referentiel referentiel,
    out referentiel jsonb,
    out statuts jsonb,
    out consequences jsonb
)
as
$$
with statuts as (select s.data
                 from evaluation.service_statuts s
                 where s.referentiel = evaluation_payload.referentiel
                   and s.collectivite_id = evaluation_payload.collectivite_id),
     consequences as ( -- on ne garde que les conséquences du référentiel concerné
         select jsonb_object_agg(tuple.key, tuple.value) as filtered
         from personnalisation_consequence pc
                  join jsonb_each(pc.consequences) tuple on true
                  join action_relation ar on tuple.key = ar.id
         where pc.collectivite_id = evaluation_payload.collectivite_id
           and ar.referentiel = evaluation_payload.referentiel)
select r.data                                        as referentiel,
       coalesce(s.data, to_jsonb('{}'::jsonb[]))     as statuts,
       coalesce(c.filtered, to_jsonb('{}'::jsonb[])) as consequences
from evaluation.service_referentiel as r
         left join statuts s on true
         left join consequences c on true
where r.referentiel = evaluation_payload.referentiel
$$ language sql stable;

COMMIT;
