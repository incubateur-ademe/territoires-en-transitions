--------------------------------
---------- STATUT --------------
--------------------------------
create type avancement as enum ('fait', 'pas_fait', 'programme', 'non_renseigne');

create table action_statut
(
    collectivite_id integer references collectivite                      not null,
    action_id       action_id references action_relation                 not null,
    avancement      avancement                                           not null,
    concerne        boolean                                              not null,
    modified_by     uuid references auth.users default auth.uid()        not null,
    modified_at     timestamp with time zone   default CURRENT_TIMESTAMP not null,

    primary key (collectivite_id, action_id)
);

alter table action_statut
    enable row level security;

create policy allow_read
    on action_statut
    for select
    using (is_any_role_on(collectivite_id));

create policy allow_insert
    on action_statut
    for insert
    with check (is_amongst_role_on(array ['agent'::role_name, 'referent'::role_name, 'conseiller'::role_name],
                                   collectivite_id));

create policy allow_update
    on action_statut
    for update
    with check (is_amongst_role_on(array ['agent'::role_name, 'referent'::role_name, 'conseiller'::role_name],
                                   collectivite_id));



create view client_action_statut
as
select collectivite_id,
       modified_by,
       action_id,
       avancement,
       concerne
from action_statut;

create view business_action_statut
as
select collectivite_id,
       referentiel,
       action_id,
       avancement,
       concerne
from action_statut
         join action_relation on action_id = action_relation.id;


--------------------------------
----------- EVENTS -------------
--------------------------------
create table collectivite_action_statut_update_event
(
    collectivite_id integer references collectivite                    not null,
    referentiel     referentiel                                        not null,
    created_at      timestamp with time zone default CURRENT_TIMESTAMP not null
);
comment on table collectivite_action_statut_update_event is
    'Used by business only to trigger score computation';

alter table collectivite_action_statut_update_event
    -- Disallow all since business use a privileged postgres access (for now).
    enable row level security;

create or replace function after_action_statut_insert_write_event() returns trigger as
$$
declare
    relation action_relation%ROWTYPE;
begin
    select * into relation from action_relation where id = NEW.action_id limit 1;
    insert into collectivite_action_statut_update_event values (NEW.collectivite_id, relation.referentiel, default);
    return null;
end;
$$ language plpgsql security definer;

create trigger after_action_statut_insert
    after insert
    on action_statut
    for each row
execute procedure after_action_statut_insert_write_event();
