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

create view client_epci
as
select siren, nom
from epci;

--------------------------------
-------- REFERENTIEL -----------
--------------------------------
create type referentiel as enum ('eci', 'cae');
create domain action_id as varchar(30); -- eg: eci_1.1.1.1


create table action_relation
(
    id          action_id primary key not null,
    referentiel referentiel           not null,
    parent      action_id references action_relation
);

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
    epci_id                serial references epci,
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
    epci_id     serial references epci                             not null,
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

create view table_as_json_schema
as
with table_columns as (
    select columns.table_name                            as title,
           column_name,
           is_nullable = 'NO' and column_default is null as required,
           udt_name
    from information_schema.columns
    where table_schema = 'public'
),
     json_type_def as (
         select title,

                json_object_agg(
                column_name,
                json_build_object('type', udt_name_to_json_type(udt_name))
                    ) filter ( where required ) as properties

         from table_columns
         group by title
     )
select title,
       json_build_object('properties', coalesce(properties, '{}')) as json_typedef
from json_type_def;

create view view_as_json_schema
as
with view_columns as (
    select distinct on (view_schema, view_name, column_name) view_name                                     as title,
                                                             column_name,
                                                             is_nullable = 'NO' and column_default is null as required,
                                                             udt_name

    from information_schema.columns
             natural full join information_schema.view_table_usage

    where view_schema = 'public'
      and column_name is not null
    order by view_name
)
select json_build_object(
               'title', title,
               'type', 'object',
               'required', coalesce(json_agg(column_name) filter ( where required ), '[]'),
               'properties', json_agg(json_build_object(
                column_name,
                json_build_object('type', udt_name_to_json_type(udt_name))
            ))
           )
from view_columns
group by title;
