create table collectivite_activation_event
(
    id              serial primary key,
    collectivite_id integer references collectivite                    not null,
    created_at      timestamp with time zone default CURRENT_TIMESTAMP not null
);
comment on table collectivite_activation_event is
    'Used by business only to trigger score computation';

alter table collectivite_activation_event
    -- Disallow all since business use a privileged postgres access (for now).
    enable row level security;

create or replace function before_collectivite_activation_insert_write_event() returns trigger as
$$
declare already_activated boolean;
begin
    select into already_activated count(*) > 0 from private_utilisateur_droit where collectivite_id = NEW.collectivite_id and active;
    if not already_activated 
    then insert into collectivite_activation_event values (default, NEW.collectivite_id, default);
    end if; 
    return NEW;
end;
$$ language plpgsql security definer;

create trigger before_collectivite_activation_insert_write_event
    before insert or update
    on private_utilisateur_droit
    for each row
execute procedure before_collectivite_activation_insert_write_event();

alter publication supabase_realtime add table collectivite_activation_event;