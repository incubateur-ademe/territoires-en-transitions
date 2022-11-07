-- Revert tet:evaluation/score_service from pg

BEGIN;

drop function if exists test.enable_evaluation_api();
drop function if exists test.disable_evaluation_api();

drop trigger after_action_statut_insert on action_statut;
drop function after_action_statut_call_business();
drop trigger after_reponse_insert on reponse_binaire;
drop trigger after_reponse_insert on reponse_choix;
drop trigger after_reponse_insert on reponse_proportion;
drop function after_reponse_call_business();
drop function evaluation.evaluate_regles;
drop function evaluation.evaluate_statuts;
drop function evaluation.evaluation_payload;
drop view evaluation.service_statuts;
drop materialized view evaluation.service_referentiel;
drop view evaluation.service_regles;
drop view evaluation.service_reponses;
drop table evaluation.service_configuration;

-- restore prev version
--- Restore le trigger pour mettre à jour le contenu suite à l'insertion de json.
create or replace function
    private.upsert_referentiel_after_json_insert()
    returns trigger
as
$$
declare
begin
    perform private.upsert_actions(new.definitions, new.children);
    return new;
end;
$$ language plpgsql;

--- Restore action statut events
create table action_statut_update_event
(
    id              serial primary key,
    collectivite_id integer references collectivite                    not null,
    referentiel     referentiel                                        not null,
    created_at      timestamp with time zone default CURRENT_TIMESTAMP not null
);
comment on table action_statut_update_event is
    'Used by business only to trigger score computation';

alter table action_statut_update_event
    -- Disallow all since business use a privileged postgres access (for now).
    enable row level security;

create or replace function after_action_statut_insert_write_event() returns trigger as
$$
declare
    relation action_relation%ROWTYPE;
begin
    select * into relation from action_relation where id = NEW.action_id limit 1;
    insert into action_statut_update_event values (default, NEW.collectivite_id, relation.referentiel, default);
    return null;
end;
$$ language plpgsql security definer;

create trigger after_action_statut_insert
    after insert or update
    on action_statut
    for each row
execute procedure after_action_statut_insert_write_event();

alter publication supabase_realtime add table action_statut_update_event;

--- Restore réponses events
create table reponse_update_event
(
    id              serial primary key,
    collectivite_id integer references collectivite                    not null,
    created_at      timestamp with time zone default CURRENT_TIMESTAMP not null
);
comment on table reponse_update_event is
    'Utilisé par le business pour déclencher un calcul des conséquences.';

alter table reponse_update_event
    -- Disallow all since business use a privileged service access.
    enable row level security;

alter publication supabase_realtime add table reponse_update_event;

create or replace function after_reponse_insert_write_event() returns trigger as
$$
begin
    insert into reponse_update_event (collectivite_id) values (new.collectivite_id);
    return null;
end;
$$ language plpgsql security definer;
comment on function after_reponse_insert_write_event is
    'Écrit un évènement après chaque écriture de réponse par un utilisateur.';

create trigger after_reponse_choix_write
    after insert or update
    on reponse_choix
    for each row
execute procedure after_reponse_insert_write_event();

create trigger after_reponse_binaire_write
    after insert or update
    on reponse_binaire
    for each row
execute procedure after_reponse_insert_write_event();

create trigger after_reponse_proportion_write
    after insert or update
    on reponse_proportion
    for each row
execute procedure after_reponse_insert_write_event();

create view unprocessed_reponse_update_event as
with latest_collectivite_event as (select collectivite_id,
                                          max(created_at) as max_date
                                   from reponse_update_event
                                   group by collectivite_id),
     active_collectivite_without_consequence as (select c.id as collectivite_id, c.created_at
                                                 from collectivite c
                                                          left join personnalisation_consequence pc on pc.collectivite_id = c.id
                                                          left join private_utilisateur_droit pud on pud.collectivite_id = c.id
                                                 where pc.collectivite_id is NULL
                                                   and pud.active),
     unprocessed_event as (select *
                           from latest_collectivite_event e
                           where collectivite_id not in (
                               -- processed means that the consequence is more recent than the event
                               select collectivite_id
                               from personnalisation_consequence c
                               where c.modified_at > e.max_date))
select collectivite_id,
       max_date as created_at
from unprocessed_event
union
select collectivite_id, created_at
from active_collectivite_without_consequence;
comment on view unprocessed_reponse_update_event is
    'Permet au business de déterminer quelles sont les collectivités '
        'dont les réponses ont changé depuis le dernier calcul des conséquences';

-- Restore la vue

create view unprocessed_action_statut_update_event
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

COMMIT;
