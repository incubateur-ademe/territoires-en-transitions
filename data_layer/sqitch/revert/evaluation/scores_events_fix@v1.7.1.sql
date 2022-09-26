-- Revert tet:evaluation/scores_events_fix from pg

BEGIN;

drop trigger set_modified_at_action_statut_update on action_statut;


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
    -- last time points where updated for a referentiel
    latest_referentiel_modification as (
        select referentiel, max(modified_at) as referentiel_last_modified_at
        from action_computed_points acp
                 left join action_relation ar on ar.id = acp.action_id
        group by (referentiel)
    ),
    -- score require to be processed either if a statut is updated or if computed_points changed
    latest_score_update_required as (
        select collectivite_id, r.referentiel, GREATEST(e.max_date::timestamp,
                                                        r.referentiel_last_modified_at::timestamp) as required_at
        from latest_event e
                 left join latest_referentiel_modification r on r.referentiel = e.referentiel
    ),
    -- events that are not processed
    unprocessed as (
        select *
        from latest_score_update_required lsur
        where collectivite_id not in (
            -- processed means that the score is more recent than the event
            select collectivite_id
            from client_scores s
            where s.score_created_at > lsur.required_at
        )
    )
select unprocessed.collectivite_id,
       unprocessed.referentiel,
       unprocessed.required_at as created_at
from unprocessed;
comment on view unprocessed_action_statut_update_event is
    'To be used by business to compute only what is necessary.';

create or replace view unprocessed_reponse_update_event as
with latest_collectivite_event as (
    select collectivite_id,
           max(created_at) as max_date
    from reponse_update_event
    group by collectivite_id
),
active_collectivite_without_consequence as (
    select c.id as collectivite_id, c.created_at
    from collectivite c left join personnalisation_consequence pc on pc.collectivite_id = c.id
    left join private_utilisateur_droit pud on pud.collectivite_id = c.id
    where pc.collectivite_id is NULL and pud.active
),
     unprocessed_event as (
         select *
         from latest_collectivite_event e
         where collectivite_id not in (
             -- processed means that the consequence is more recent than the event
             select collectivite_id
             from personnalisation_consequence c
             where c.modified_at > e.max_date
         )
     )
select collectivite_id,
       max_date as created_at
from unprocessed_event
union
select collectivite_id, created_at
from active_collectivite_without_consequence;
comment on view unprocessed_reponse_update_event is
    'Permet au business de déterminer quelles sont les collectivités '
    'dont les réponses ont changé depuis le dernier calcul des conséquences';


alter table personnalisation_regle drop column modified_at;

COMMIT;
