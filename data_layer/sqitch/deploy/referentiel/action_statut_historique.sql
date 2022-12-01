-- Deploy tet:referentiel/action_statut_history to pg
-- requires: referentiel/action_statut

BEGIN;

create function historique.action_statuts_at(
    collectivite_id int,
    referentiel referentiel,
    "time" timestamp with time zone
)
    returns setof historique.action_statut
begin
    atomic
    with latest as (select max(modified_at) as max, action_id
                    from historique.action_statut s
                             join action_relation ar on s.action_id = ar.id
                    where s.collectivite_id = action_statuts_at.collectivite_id
                      and ar.referentiel = action_statuts_at.referentiel
                      and s.modified_at <= action_statuts_at.time
                    group by action_id)
    select id,
           s.collectivite_id,
           s.action_id,
           avancement,
           previous_avancement,
           avancement_detaille,
           previous_avancement_detaille,
           concerne,
           previous_concerne,
           modified_by,
           previous_modified_by,
           modified_at,
           previous_modified_at
    from historique.action_statut s
             join latest l
                  on s.action_id = l.action_id
                      and s.modified_at = l.max
    where s.collectivite_id = action_statuts_at.collectivite_id;
end;
comment on function historique.action_statuts_at
    is 'Les statuts d''une collectivité à un moment donné.';

COMMIT;
