-- Deploy tet:evaluation/score_service to pg

BEGIN;

-- restaure la version précédente
create or replace view evaluation.service_statuts
as
select collectivite_id,
       referentiel,
       jsonb_agg(jsonb_build_object(
               'action_id', action_id,
               'detailed_avancement',
               case
                   when avancement = 'fait' then jsonb_build_object(
                           'fait', 1.0,
                           'programme', 0.0,
                           'pas_fait', 0.0
                       )
                   when avancement = 'programme' then jsonb_build_object(
                           'fait', 0.0,
                           'programme', 1.0,
                           'pas_fait', 0.0
                       )
                   when avancement = 'pas_fait' then jsonb_build_object(
                           'fait', 0.0,
                           'programme', 0.0,
                           'pas_fait', 1.0
                       )
                   when avancement = 'detaille' then jsonb_build_object(
                           'fait', avancement_detaille[1],
                           'programme', avancement_detaille[2],
                           'pas_fait', avancement_detaille[3]
                       )
                   end,
               'concerne', concerne
           )) as data
from action_statut
         left join action_relation on action_statut.action_id = action_relation.id
group by collectivite_id, referentiel;
comment on view evaluation.service_statuts
    is 'Les statuts des action au format JSON, inclus dans les payload envoyées au service.';


drop function evaluation.convert_statut;

COMMIT;
