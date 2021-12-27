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
comment on table collectivite_action_statut_update_event is 'Used by business to trigger score computation';


create or replace function after_action_statut_insert_write_event() returns trigger as
$$
declare
    relation action_relation%ROWTYPE;
begin
    select * into relation from action_relation where id = NEW.action_id limit 1;
    insert into collectivite_action_statut_update_event values (NEW.collectivite_id, relation.referentiel, default);
    return null;
end;
$$ language plpgsql;

create trigger after_action_statut_insert
    after insert
    on action_statut
    for each row
execute procedure after_action_statut_insert_write_event();
