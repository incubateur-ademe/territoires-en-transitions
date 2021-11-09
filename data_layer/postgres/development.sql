set search_path to public;

---------------------------------
------------ EPCI ---------------
---------------------------------
create domain siren as varchar(14)
    check (
        value ~ '^\d{14}$'
        );


create table epci
(
    id          serial primary key,
    siren       siren                                              not null,
    nom         varchar(300)                                       not null,
    created_at  timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at timestamp with time zone default CURRENT_TIMESTAMP not null
);
comment on table epci is 'EPCI information, writable only by postgres user';

create view client_epci
as
select siren, nom
from epci;
comment on view client_epci is 'The necessary EPCI information to display in the client.';

--------------------------------
-------- REFERENTIEL -----------
--------------------------------
create type referentiel as enum ('eci', 'cae');
comment on type referentiel is 'An enum representing a referentiel';

create domain action_id as varchar(30);
comment on type action_id is 'A unique action id. ex: eci_1.1.1.1';


create table action_relation
(
    id          action_id primary key not null,
    referentiel referentiel           not null,
    parent      action_id references action_relation
);
comment on table action_relation is
    'Relation between an action and its parent. '
        'Parent must be inserted before its child; child must be deleted before its parent.';

create view action_children
as
select referentiel, id, parent, children.ids as children
from action_relation
         left join lateral (
    select array_agg(id) as ids
    from action_relation
    where id = action_relation.parent
    )
    as children on true;
comment on view action_children is
    'Action and its children, computed from action relation';


--------------------------------
---------- STATUT --------------
--------------------------------
create type avancement as enum ('fait', 'pas_fait', 'programme', 'non_renseigne');


create table action_statut
(
    id          serial primary key,
    epci_id     serial references epci                             not null,
    action_id   action_id references action_relation               not null,
    avancement  avancement                                         not null,
    concerne    boolean                                            not null,
    modified_by uuid references auth.users                         not null,
    modified_at timestamp with time zone default CURRENT_TIMESTAMP not null
);



create view client_action_statut
as
select epci_id,
       modified_by,
       action_id,
       avancement,
       concerne
from action_statut;

create view business_action_statut
as
select epci_id,
       referentiel,
       action_id,
       avancement,
       concerne
from action_statut
         join action_relation on action_id = action_relation.id;

--------------------------------
----------- SCORE --------------
--------------------------------
create table score
(
    id                     serial primary key,
    epci_id                integer references epci                            not null,
    action_id              action_id references action_relation               not null,
    points                 real                                               not null,
    potentiel              real                                               not null,
    referentiel_points     real                                               not null,
    concernee              bool                                               not null,
    previsionnel           real                                               not null,
    total_taches_count     int                                                not null,
    completed_taches_count int                                                not null,
    created_at             timestamp with time zone default CURRENT_TIMESTAMP not null
);


create view client_score
as
select action_id, referentiel, points, potentiel
from score
         join action_relation on action_id = action_relation.id;


--------------------------------
----------- EVENTS -------------
--------------------------------
create table epci_action_statut_update_event
(
    epci_id     integer references epci                             not null,
    referentiel referentiel                                        not null,
    created_at  timestamp with time zone default CURRENT_TIMESTAMP not null
);


create or replace function after_action_statut_insert_write_event() returns trigger as
$$
declare
    relation action_relation%ROWTYPE;
begin
    select * into relation from action_relation where id = NEW.action_id limit 1;
    insert into epci_action_statut_update_event values (NEW.epci_id, relation.referentiel, default);
    return null;
end;
$$ language 'plpgsql';

create trigger after_action_statut_insert
    after insert
    on action_statut
    for each row
execute procedure after_action_statut_insert_write_event();


--------------------------------
---------- PROCESSING ----------
--------------------------------
create view unprocessed_epci_action_statut_update_event
as
select epci_action_statut_update_event.epci_id, referentiel, created_at
from epci_action_statut_update_event
         join (
    select epci_id, max(created_at) as date
    from score
    group by epci_id
)
    as latest_epci_score on epci_action_statut_update_event.epci_id = latest_epci_score.epci_id
where epci_action_statut_update_event.created_at > latest_epci_score.date;

--------------------------------
----------- LOGGING ------------
--------------------------------
create table action_statut_log
(
    logged_at timestamp with time zone default CURRENT_TIMESTAMP not null
) inherits (action_statut);

create table score_log
(
    logged_at timestamp with time zone default CURRENT_TIMESTAMP not null
) inherits (score);


create function before_action_statut_update_write_log() returns trigger as
$$
declare
begin
    -- todo delete recently archived statut from the same user using a time interval.

    -- read action statut and copy it into action statut log
    insert into action_statut_log values (OLD.*, default);
    return null;
end;
$$ language 'plpgsql';

create trigger before_action_statut_update
    before update
    on action_statut
    for each row
execute procedure before_action_statut_update_write_log();



--------------------------------
----------- TYPING -------------
--------------------------------
create function udt_name_to_json_type(udt_name text) returns text
as
$$
begin
    return
        case
            when udt_name ~ '^bool' then 'boolean'
            when udt_name ~ '^int' then 'int32'
            when udt_name ~ '^float' then 'float64'
            when udt_name ~ '^timestamp' then 'timestamp'
            else 'string'
            end;
end;
$$ language plpgsql;
comment on function udt_name_to_json_type(udt_name text) is
    'Returns a type as a string compatible with json type definition.';

create view table_as_json_typedef
as
with table_columns as (
    select columns.table_name     as title,
           column_name,
           column_default is null as mandatory,
           udt_name

    from information_schema.columns
    where table_schema = 'public'
),
     json_type_def as (
         select title,
                json_object_agg(
                        column_name,
                        json_build_object('type', udt_name_to_json_type(udt_name))
                    )                            as all_properties,

                json_object_agg(
                column_name,
                json_build_object('type', udt_name_to_json_type(udt_name))
                    ) filter ( where mandatory ) as writable_properties

         from table_columns
         group by title
     )
select title,
       json_build_object('properties', coalesce(all_properties, '{}'))      as read,
       json_build_object('properties', coalesce(writable_properties, '{}')) as write
from json_type_def;
comment on view table_as_json_typedef is
    'Json type definition for all public tables (including views). Only non nullable/non default fields are listed';

select *
from table_as_json_typedef;
