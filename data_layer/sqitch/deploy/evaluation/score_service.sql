-- Deploy tet:evaluation/score_service to pg

BEGIN;

-- On sort la partie conversion des statuts de sa vue
-- afin de la réutiliser dans le cadre des scores pre-audit.

create function evaluation.convert_statut(
    action_id action_id,
    avancement avancement,
    avancement_detaille numeric[],
    concerne boolean
)
    returns jsonb
    -- Utilise la nouvelle syntaxe de déclaration de fonction de pg14
    -- https://www.cybertec-postgresql.com/en/better-sql-functions-in-postgresql-v14/
return
    (select jsonb_build_object(
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
                ));
comment on function evaluation.convert_statut
    is 'Convertit les statuts des action au format JSON, inclus dans les payload envoyées au service.';

create or replace view evaluation.service_statuts
as
select collectivite_id,
       referentiel,
       jsonb_agg(evaluation.convert_statut(action_id, avancement, avancement_detaille, concerne)) as data
from action_statut
         left join action_relation on action_statut.action_id = action_relation.id
group by collectivite_id, referentiel;

COMMIT;
