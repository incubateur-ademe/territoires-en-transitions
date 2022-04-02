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


create or replace view unprocessed_reponse_update_event as
with latest_collectivite_event as (
    select collectivite_id,
           max(created_at) as max_date
    from reponse_update_event
    group by collectivite_id
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
from unprocessed_event;
comment on view unprocessed_reponse_update_event is
    'Permet au business de déterminer quelles sont les collectivités '
    'dont les réponses on changées depuis le dernier calcul des conséquences';
