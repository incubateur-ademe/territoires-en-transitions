-- Deploy tet:evaluation/scores_events_fix to pg
-- requires: evaluation/scores_events

BEGIN;

create trigger set_modified_at_action_statut_update
    before update
    on
        action_statut
    for each row
execute procedure update_modified_at();


create or replace view unprocessed_action_statut_update_event
as
with
    -- active collectivite
    unique_collectivite_droit as (
        select collectivite_id, min(created_at) as max_date
        from private_utilisateur_droit
        where active
        group by collectivite_id
    ),
    -- cross join active collectivite with (eci, cae)
    activation_updates as (
        select collectivite_id,
               unnest('{eci, cae}'::referentiel[]) as referentiel,
               max_date as updated_at
        from unique_collectivite_droit
    ),
    -- update on statuses per collectivite and referentiel
    statut_updates as (
        select collectivite_id, max(modified_at) as updated_at, referentiel
        from action_statut left join action_definition_summary on action_statut.action_id = action_definition_summary.id
        group by (collectivite_id, referentiel)
    ),
    -- update on referentiel computed points 
    referentiels_last_update as (
        select  referentiel, max(modified_at) as updated_at
        from action_computed_points acp
        left join action_relation ar on ar.id = acp.action_id
        group by (referentiel)
      ),
    referentiels_updates as (
        select referentiel, updated_at, collectivite_id
        from referentiels_last_update inner join private_utilisateur_droit on 1 = 1),
    -- vertical join of all update that would require to re-calculate the scores 
    all_updates as (
      select collectivite_id,
                  referentiel,
                  updated_at
      from activation_updates a
                full join statut_updates using (collectivite_id, referentiel, updated_at)
                full join referentiels_updates using (collectivite_id, referentiel, updated_at)
    ),
    -- last update per referentiel, per collectivite, that would require re-calculate the scores
    latest_updates as (
      select collectivite_id,
             referentiel,
             max(updated_at) as updated_at
      from all_updates
      group by collectivite_id, referentiel
    ),
    -- last scores calculation date  
    latest_client_scores as (
       select collectivite_id,
             referentiel,
             max(score_created_at) as score_created_at
        from client_scores 
        group by (collectivite_id, referentiel)
    )
    -- filter updates that happened after the last score update (for collectivite and referentiel)
    select collectivite_id, referentiel, updated_at::timestamp as created_at from latest_updates
    left join latest_client_scores using (referentiel, collectivite_id)
    where score_created_at is null or updated_at > score_created_at;

comment on view unprocessed_action_statut_update_event is
    'To be used by business to compute only what is necessary.';


alter table personnalisation_regle add column modified_at timestamp with time zone default CURRENT_TIMESTAMP not null; 


create or replace view unprocessed_reponse_update_event as
with
    -- active collectivite
    activation_updates as (
        select collectivite_id, min(created_at) as updated_at
        from private_utilisateur_droit
        where active
        group by collectivite_id
    ),
    -- update on reponse per collectivite
    reponse_updates as (
        select collectivite_id, max(created_at) as updated_at
        from reponse_update_event
        group by (collectivite_id)
    ),
    -- update on personnalisation regles
    regles_updates as (
        select collectivite_id, max(pr.modified_at) as updated_at
        from personnalisation_regle pr inner join private_utilisateur_droit on 1 = 1
        group by collectivite_id
      ),
    -- vertical join of all update that would require to re-calculate the personnalisation consequences 
    all_updates as (
      select collectivite_id,
                  updated_at
      from activation_updates a
                full join reponse_updates using (collectivite_id, updated_at)
                full join regles_updates using (collectivite_id, updated_at)
    ),
    -- last update per referentiel, per collectivite, that would require re-calculate the scores
    latest_updates as (
      select collectivite_id,
             max(updated_at) as updated_at
      from all_updates
      group by collectivite_id
    ),
    -- last consequences calculation date  
    latest_computed_consequences as (
       select collectivite_id,
             max(modified_at) as consequences_modified_at
        from personnalisation_consequence 
        group by (collectivite_id)
    )
    -- filter updates that happened after the last score update (for collectivite and referentiel)
    select collectivite_id, updated_at as created_at from latest_updates
    left join latest_computed_consequences using (collectivite_id)
    where consequences_modified_at is null or updated_at > consequences_modified_at;
comment on view unprocessed_reponse_update_event is
    'Permet au business de déterminer quelles sont les collectivités '
    'pour lesquelles il faut calculer les conséquences des règles de personnalisation';


COMMIT;
