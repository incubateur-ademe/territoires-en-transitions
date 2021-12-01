set search_path to public;

create type nature as enum ('SMF', 'CU', 'CC', 'SIVOM', 'POLEM', 'MET69', 'METRO', 'SMO', 'CA', 'EPT', 'SIVU', 'PETR');
create domain siren as varchar(9)
    check (
        value ~ '^\d{9}$'
        );
create type role_name as enum ('agent', 'conseiller', 'auditeur');


---------------------------------
------------ EPCI ---------------
---------------------------------
create table epci
(
    id          serial primary key,
    siren       siren                                              not null,
    nom         varchar(300)                                       not null,
    nature      nature                                             not null,
    created_at  timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at timestamp with time zone default CURRENT_TIMESTAMP not null
);
comment on table epci is 'EPCI information, writable only by postgres user';

create view client_epci
as
select siren, nom
from epci;
comment on view client_epci is 'The necessary EPCI information to display in the client.';


---------------------------------
------------ DROITS -------------
---------------------------------

create table private_utilisateur_droit
(
    id          serial primary key,
    user_id     uuid references auth.users                         not null,
    epci_id     integer references epci                            not null,
    role_name   role_name                                          not null,
    active      bool                                               not null,
    created_at  timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at timestamp with time zone default CURRENT_TIMESTAMP not null
);

create table private_epci_invitation
(
    id         serial primary key,
    role_name  role_name                                          not null,
    epci_id    integer references epci                            not null,
    created_by uuid references auth.users,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null
);


-- utilisateur trigger before insert
-- - check no other utilisateur_droit for epci
-- - check

-- works for unclaimed epci only
create or replace function claim_epci(siren siren) returns boolean
as
$$
declare
    epci_already_claimed bool;
    claimed_epci_id      integer;
begin

    select id from epci where epci.siren = $1 into claimed_epci_id;

    select count(*) > 0
    from private_utilisateur_droit
    where epci_id = claimed_epci_id
    into epci_already_claimed;

    if not epci_already_claimed
    then
        insert into private_utilisateur_droit(user_id, epci_id, role_name, active)
        values (auth.uid(), claimed_epci_id, 'agent', true);
        return true;
    else
        return false;
    end if;

end;
$$ language plpgsql;

-- create function accept_invitation(invitation_id uuid);
-- create function create_invitation();

create view client_owned_epci
as
with current_droits as (
    select *
    from private_utilisateur_droit
    where user_id = auth.uid()
)
select siren, nom, role_name
from current_droits
         join epci on epci_id = epci.id
order by nom;

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

create or replace view action_children
as
select referentiel, id, parent, children.ids as children
from action_relation as ar
         left join lateral (
    select array_agg(action_relation.id) as ids
    from action_relation
    where action_relation.parent = ar.id

    )
    as children on true;
comment on view action_children is
    'Action and its children, computed from action relation';

select *
from action_children;

--------------------------------
---------- STATUT --------------
--------------------------------
create type avancement as enum ('fait', 'pas_fait', 'programme', 'non_renseigne');


create table action_statut
(
    id          serial primary key,
    epci_id     integer references epci                              not null,
    action_id   action_id references action_relation                 not null,
    avancement  avancement                                           not null,
    concerne    boolean                                              not null,
    modified_by uuid references auth.users default auth.uid()        not null,
    modified_at timestamp with time zone   default CURRENT_TIMESTAMP not null
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
    epci_id                integer references epci                not null,
    action_id              action_id references action_relation   not null,
    points                 real                                   not null,
    potentiel              real                                   not null,
    referentiel_points     real                                   not null,
    concernee              bool                                   not null,
    previsionnel           real                                   not null,
    total_taches_count     int                                    not null,
    completed_taches_count int                                    not null,
    created_at             timestamp with time zone default Now() not null
);

comment on table score is 'Score data is created by the business';
comment on column score.created_at is
    'Used to group scores in batches because rows created during a transaction have the same values';

create table client_scores
(
    id               serial primary key,
    epci_id          integer references epci  not null,
    referentiel      referentiel              not null,
    scores           jsonb                    not null,
    score_created_at timestamp with time zone not null
);
comment on table client_scores is 'Client score data is generated from score on trigger';
comment on column client_scores.score_created_at is 'Equal score.created_at.';


create or replace function
    get_score_batches_for_epci(
    epci_id integer
)
    returns table
            (
                epci_id     int,
                referentiel referentiel,
                scores      jsonb,
                created_at  timestamptz
            )
as
$$
select score.epci_id,
       action_relation.referentiel,
       jsonb_agg(
               jsonb_build_object(
                       'action_id', action_id,
                       'point', points,
                       'potentiel', potentiel,
                       'referentiel', action_relation.referentiel,
                       'referentiel_points', referentiel_points,
                       'concernee', concernee,
                       'previsionnel', previsionnel,
                       'total_taches_count', total_taches_count,
                       'completed_taches_count', completed_taches_count
                   )
           ) as scores,
       created_at
from score
         join action_relation on
    action_id = action_relation.id
where score.epci_id = $1
group by score.epci_id, action_relation.referentiel, created_at;
$$ language sql;


create or replace function
    should_create_client_scores_for_epci(
    epci_id integer,
    created timestamp with time zone
) returns bool
as
$$
select count(*) > 0
from score
where score.epci_id = $1
  and score.created_at = $2;
$$ language sql;



create or replace function after_score_update_insert_client_scores() returns trigger as
$$
declare
    existingClientScoreCount bool;
begin
    -- find existing client scores
    select should_create_client_scores_for_epci(NEW.epci_id, NEW.created_at)
    into existingClientScoreCount;

    if existingClientScoreCount
    then
        -- insert client score
        insert into client_scores (epci_id, referentiel, scores, score_created_at)
        select batches.epci_id,
               batches.referentiel,
               batches.scores,
               batches.created_at
        from get_score_batches_for_epci(NEW.epci_id) as batches;
    end if;
    return null;
end;
$$ language 'plpgsql';

create constraint trigger after_score_write
    after update or insert
    on score
    deferrable
        initially deferred
    for each row
execute procedure after_score_update_insert_client_scores();

--------------------------------
--------ACTION COMMENTAIRE------
--------------------------------

create table action_commentaire
(
    id          serial primary key,
    epci_id     integer references epci                              not null,
    action_id   action_id references action_relation                 not null,
    commentaire text                                                 not null,
    modified_by uuid references auth.users default auth.uid()        not null,
    modified_at timestamp with time zone   default CURRENT_TIMESTAMP not null
);

-- alter table action_commentaire
--     enable row level security;

-- create policy "Enable select"
--     on action_commentaire
--     for select
--     using (true);


-- create policy "Insert for authenticated user"
--     on action_commentaire
--     for insert
--     with check (true);

--------------------------------
----------- EVENTS -------------
--------------------------------
create table epci_action_statut_update_event
(
    epci_id     integer references epci                            not null,
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
