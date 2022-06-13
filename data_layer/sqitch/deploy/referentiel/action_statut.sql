-- Deploy tet:action_statut to pg
-- requires: private_schema
-- requires: referentiel
-- requires: collectivites

BEGIN;

create type avancement as enum ('fait', 'pas_fait', 'programme', 'non_renseigne', 'detaille');

create table action_statut
(
    collectivite_id     integer references collectivite                      not null,
    action_id           action_id references action_relation                 not null,
    avancement          avancement                                           not null,
    avancement_detaille numeric[],
    concerne            boolean                                              not null,
    modified_by         uuid references auth.users default auth.uid()        not null,
    modified_at         timestamp with time zone   default CURRENT_TIMESTAMP not null,

    primary key (collectivite_id, action_id)
);
comment on table action_statut is 'Action statut set by the user.';
comment on column action_statut.avancement_detaille is 'An array of 3 floats: fait, programme, pas_fait';

alter table action_statut
    add constraint avancement_detaille_length check (cardinality(avancement_detaille) = 3);

create or replace function private.check_avancement_detaille_sum()
    returns trigger as
$$
declare
    total float;
begin
    if new.avancement != 'detaille'
    then
        return new;
    end if;

    select sum(t) from unnest(new.avancement_detaille) t into total;
    if total = 1
    then
        return new;
    else
        raise 'avancement_detaille does not sum to 1';
    end if;
end
$$ language plpgsql;

create trigger action_statut_check_insert
    before insert
    on action_statut
    for each row
execute procedure private.check_avancement_detaille_sum();

create trigger action_statut_check_update
    before update
    on action_statut
    for each row
execute procedure private.check_avancement_detaille_sum();



alter table action_statut
    enable row level security;

create policy allow_read
    on action_statut
    for select
    using (is_authenticated());

create policy allow_insert
    on action_statut
    for insert
    with check (is_amongst_role_on(array ['agent'::role_name, 'referent'::role_name, 'conseiller'::role_name],
                                   collectivite_id));

create policy allow_update
    on action_statut
    for update
    using (is_amongst_role_on(array ['agent'::role_name, 'referent'::role_name, 'conseiller'::role_name],
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
       avancement_detaille,
       concerne
from action_statut
         join action_relation on action_id = action_relation.id;

alter publication supabase_realtime add table action_statut;

--------------------------------
----------- EVENTS -------------
--------------------------------
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

COMMIT;
