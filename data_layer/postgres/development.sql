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
    percentage             real                                               not null,
    concernee              bool                                               not null,
    previsionnel           real                                               not null,
    total_taches_count     int                                                not null,
    completed_taches_count int                                                not null,
    created_at             timestamp with time zone default CURRENT_TIMESTAMP not null
);


create view client_score
as
select action_id, referentiel, points, percentage, potentiel
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


create function after_action_statut_insert_write_event() returns trigger as
$$
begin
    insert into epci_action_statut_update_event values (NEW.epci_id, default);
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
