set search_path to public;

create type nature as enum ('SMF', 'CU', 'CC', 'SIVOM', 'POLEM', 'MET69', 'METRO', 'SMO', 'CA', 'EPT', 'SIVU', 'PETR');
create domain siren as varchar(9)
    check (
        value ~ '^\d{9}$'
        );
create type role_name as enum ('agent', 'referent', 'conseiller', 'auditeur');


create table absract_modified_at
(
    modified_at timestamp with time zone default CURRENT_TIMESTAMP not null
);


---------------------------------
------------ EPCI ---------------
---------------------------------
create table collectivite
(
    id          serial primary key,
    created_at  timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at timestamp with time zone default CURRENT_TIMESTAMP not null
);
comment on table collectivite is 'EPCI information, writable only by postgres user';

create table epci
(
    id              serial primary key,
    collectivite_id integer references collectivite,
    nom         varchar(300)                                       not null,
    siren           siren unique not null,
    nature          nature       not null
);



create or replace function before_epci_write_create_collectivite() returns trigger as
$$
declare
    created_collectivite_id integer;
begin
    insert into collectivite default values;
    select currval(pg_get_serial_sequence('collectivite', 'id')) into created_collectivite_id;
    new.collectivite_id = created_collectivite_id;
    -- The new is what will be inserted
    return new;
end;
$$ language plpgsql;

create trigger before_epci_write
    before insert
    on epci
    for each row
execute procedure before_epci_write_create_collectivite();

create view named_collectivite
as
select collectivite_id, epci.nom as nom
from collectivite join epci on epci.collectivite_id = collectivite_id
order by nom;
comment on view named_collectivite is 'All EPCIs with the necessary information to display in the client.';

-- create table groupement
-- (
--     id     serial primary key,
--     nom    varchar(300) not null
-- );
--
-- create table collectivite_groupement
-- (
--     id              serial primary key,
--     collectivite_id integer references collectivite,
--     groupement_id   integer references groupement
-- );

---------------------------------
-------------- DCP --------------
---------------------------------
create table dcp
(
    user_id     uuid references auth.users,
    nom         text                                               not null,
    prenom      text                                               not null,
    email       text                                               not null,
    limited     bool                     default false             not null,
    deleted     bool                     default false             not null,
    created_at  timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at timestamp with time zone default CURRENT_TIMESTAMP not null
);
comment on table dcp is 'Les données à caractère personnel.';

alter table dcp
    enable row level security;

create policy own_dcp_only
    on dcp
    for all
    using (auth.uid() = user_id);

---------------------------------
------------ DROITS -------------
---------------------------------

create table private_utilisateur_droit
(
    id              serial primary key,
    user_id         uuid references auth.users                         not null,
    collectivite_id integer references collectivite                    not null,
    role_name       role_name                                          not null,
    active          bool                                               not null,
    created_at      timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at     timestamp with time zone default CURRENT_TIMESTAMP not null
);

create table private_epci_invitation
(
    id              serial primary key,
    role_name       role_name                                          not null,
    collectivite_id integer references collectivite                    not null,
    created_by      uuid references auth.users,
    created_at      timestamp with time zone default CURRENT_TIMESTAMP not null
);

create or replace view active_collectivite as
select named_collectivite.collectivite_id, nom
from named_collectivite
         join private_utilisateur_droit on named_collectivite.collectivite_id = private_utilisateur_droit.collectivite_id
where private_utilisateur_droit.id is not null
  and private_utilisateur_droit.active
group by named_collectivite.collectivite_id, nom
order by nom;


create or replace function claim_collectivite(id integer) returns json
as
$$
declare
    collectivite_already_claimed bool;
    claimed_collectivite_id      integer;
begin
    select id into claimed_collectivite_id;

    -- compute collectivite_already_claimed, which is true if a droit exist for claimed collectivite
    select count(*) > 0
    from private_utilisateur_droit
    where private_utilisateur_droit.collectivite_id = claimed_collectivite_id
    into collectivite_already_claimed;

    if not collectivite_already_claimed
    then
        -- current user can claim collectivite as its own
        -- create a droit for current user on collectivite
        insert into private_utilisateur_droit(user_id, collectivite_id, role_name, active)
        values (auth.uid(), claimed_collectivite_id, 'referent', true);
        -- return a success message
        perform set_config('response.status', '200', true);
        return json_build_object('message', 'Vous êtes référent de la collectivité.');
    else
        -- current user cannot claim the collectivite
        -- return an error with a reason
        perform set_config('response.status', '409', true);
        return json_build_object('message', 'La collectivité dispose déjà d''un référent.');
    end if;
end
$$ language plpgsql;
comment on function claim_collectivite is
    'Claims an EPCI : '
        'will succeed with a code 200 if this EPCI does not have referent yet.'
        'If the EPCI was already claimed it will fail with a code 409.';

create or replace function quit_collectivite(id integer) returns json as
$$
declare
    collectivite_already_joined bool;
    joined_collectivite_id      integer;
begin
    select id into joined_collectivite_id;

    -- compute epci_already_joined, which is true if a droit exist for claimed epci
    select count(*) > 0
    from private_utilisateur_droit
    where collectivite_id = joined_collectivite_id
      and role_name = 'referent'
    into collectivite_already_joined;

    if not collectivite_already_joined
    then
        -- current user cannot quit an epci that was not joined.
        -- return an error with a reason
        perform set_config('response.status', '409', true);
        return json_build_object('message', 'Vous n''avez pas pu quitter la collectivité.');
    else
        -- current user quit collectivité
        -- deactivate the droits
        update private_utilisateur_droit
        set active      = false,
            modified_at = now()
        where collectivite_id = joined_collectivite_id;

        -- return success with a message
        perform set_config('response.status', '200', true);
        return json_build_object('message', 'Vous avez quitté la collectivité.');
    end if;
end
$$ language plpgsql;
comment on function quit_collectivite is
    'Unclaims an Collectivité: '
        'Will succeed with a code 200 if user have a droit on this collectivité.'
        'Otherwise it will fail wit a code 40x.';


create or replace function referent_contact(id integer) returns json as
$$
declare
    requested_collectivite_id integer;
    referent_id               uuid;
    referent_email            text;
    referent_nom              text;
    referent_prenom           text;
begin
    -- select the collectivite id to get contact info from using its siren
    select id into requested_collectivite_id;

    -- select referent user id
    select user_id
    from private_utilisateur_droit
    where collectivite_id = requested_collectivite_id
      and role_name = 'referent'
    into referent_id;

    if referent_id is null
    then
        perform set_config('response.status', '404', true);
        return json_build_object('message', 'Cette collectivité n''a pas de référent.');
    else
        -- retrieve contact information of referent_id TODO
        select email, nom, prenom
        from dcp
        where user_id = referent_id
        into referent_email, referent_nom, referent_prenom;
        perform set_config('response.status', '200', true);
        return json_build_object('email', referent_email, 'nom', referent_nom, 'prenom', referent_prenom);
    end if;
end

$$ language plpgsql security definer;
comment on function referent_contact is
    'Returns the contact information of the Collectivité referent given the siren.';



create or replace function teapot() returns json as
$$
begin
    perform set_config('response.status', '418', true);
    return json_build_object('message', 'The requested entity body is short and stout.',
                             'hint', 'Tip it over and pour it out.');
end;
$$ language plpgsql;

-- create function accept_invitation(invitation_id uuid);
-- create function create_invitation();

create view owned_collectivite
as
with current_droits as (
    select *
    from private_utilisateur_droit
    where user_id = auth.uid()
)
select named_collectivite.collectivite_id as collectivite_id, named_collectivite.nom, role_name
from current_droits
         join named_collectivite on named_collectivite.collectivite_id = current_droits.collectivite_id
         join epci on named_collectivite.collectivite_id = epci.collectivite_id
order by nom;


create or replace view elses_collectivite
as
select active_collectivite.collectivite_id, active_collectivite.nom
from active_collectivite
         full outer join owned_collectivite on
        owned_collectivite.collectivite_id = active_collectivite.collectivite_id
where auth.uid() is null -- return all active collectivités if auth.user is null
   or owned_collectivite.collectivite_id is not null;
comment on view elses_collectivite is 'Collectivités not belonging to the authenticated user';


--------------------------------
-------- REFERENTIEL -----------
--------------------------------
create type referentiel as enum ('eci', 'cae');
comment on type referentiel is 'An enum representing a referentiel';

create domain action_id as varchar(30);
comment on type action_id is 'A unique action id. ex: eci_1.1.1.1';


create table action_relation
(
    id          action_id primary key,
    referentiel referentiel not null,
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


--------------------------------
---------- STATUT --------------
--------------------------------
create type avancement as enum ('fait', 'pas_fait', 'programme', 'non_renseigne');


create table action_statut
(
    id              serial primary key,
    collectivite_id integer references collectivite                      not null,
    action_id       action_id references action_relation                 not null,
    avancement      avancement                                           not null,
    concerne        boolean                                              not null,
    modified_by     uuid references auth.users default auth.uid()        not null,
    modified_at     timestamp with time zone   default CURRENT_TIMESTAMP not null
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
----------- SCORE --------------
--------------------------------

create table score
(
    id                     serial primary key,
    collectivite_id        integer references collectivite        not null,
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
    collectivite_id  integer references collectivite not null,
    referentiel      referentiel                     not null,
    scores           jsonb                           not null,
    score_created_at timestamp with time zone        not null
);
comment on table client_scores is 'Client score data is generated from score on trigger';
comment on column client_scores.score_created_at is 'Equal score.created_at.';


create or replace function
    get_score_batches_for_epci(
    collectivite_id integer
)
    returns table
            (
                collectivite_id int,
                referentiel     referentiel,
                scores          jsonb,
                created_at      timestamptz
            )
as
$$
select score.collectivite_id,
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
where score.collectivite_id = $1
group by score.collectivite_id, action_relation.referentiel, created_at;
$$ language sql;


create or replace function
    should_create_client_scores_for_epci(
    collectivite_id integer,
    created timestamp with time zone
) returns bool
as
$$
select count(*) > 0
from score
where score.collectivite_id = $1
  and score.created_at = $2;
$$ language sql;



create or replace function after_score_update_insert_client_scores() returns trigger as
$$
declare
    existingClientScoreCount bool;
begin
    -- find existing client scores
    select should_create_client_scores_for_epci(NEW.collectivite_id, NEW.created_at)
    into existingClientScoreCount;

    if existingClientScoreCount
    then
        -- insert client score
        insert into client_scores (collectivite_id, referentiel, scores, score_created_at)
        select batches.collectivite_id,
               batches.referentiel,
               batches.scores,
               batches.created_at
        from get_score_batches_for_epci(NEW.collectivite_id) as batches;
    end if;
    return null;
end;
$$ language plpgsql;

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
    id              serial primary key,
    collectivite_id integer references collectivite                      not null,
    action_id       action_id references action_relation                 not null,
    commentaire     text                                                 not null,
    modified_by     uuid references auth.users default auth.uid()        not null,
    modified_at     timestamp with time zone   default CURRENT_TIMESTAMP not null
);

alter table action_commentaire
    enable row level security;

create policy "Enable select"
    on action_commentaire
    for select
    using (true);

create policy "Insert for authenticated user"
    on action_commentaire
    for insert
    with check (true);

--------------------------------
----------- EVENTS -------------
--------------------------------
create table epci_action_statut_update_event
(
    collectivite_id integer references collectivite                    not null,
    referentiel     referentiel                                        not null,
    created_at      timestamp with time zone default CURRENT_TIMESTAMP not null
);


create or replace function after_action_statut_insert_write_event() returns trigger as
$$
declare
    relation action_relation%ROWTYPE;
begin
    select * into relation from action_relation where id = NEW.action_id limit 1;
    insert into epci_action_statut_update_event values (NEW.collectivite_id, relation.referentiel, default);
    return null;
end;
$$ language plpgsql;

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
select epci_action_statut_update_event.collectivite_id, referentiel, created_at
from epci_action_statut_update_event
         join (
    select collectivite_id, max(created_at) as date
    from score
    group by collectivite_id
)
    as latest_epci_score on epci_action_statut_update_event.collectivite_id = latest_epci_score.collectivite_id
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
$$ language plpgsql;

create trigger before_action_statut_update
    before update
    on action_statut
    for each row
execute procedure before_action_statut_update_write_log();

--------------------------------
----------- BUSINESS -------------
--------------------------------
create type indicateur_group as enum ('cae', 'crte', 'eci');

-- create table climat_pratic_thematique
-- (
--     id  text primary key,
--     nom text not null
-- ) inherits (absract_modified_at);

create table indicateur_parent
(
    id     serial primary key,
    numero text unique not null,
    nom    text        not null
);
comment on table indicateur_parent is 'An optional parent used to group indicateurs together.';



create domain indicateur_id as varchar(30);
create table indicateur_definition
(
    id indicateur_id primary key,
    indicateur_group indicateur_group not null,
    identifiant   text not null,
    valeur_indicateur indicateur_id references indicateur_definition,
    nom           text not null,
    description   text not null,
    unite         text not null,
    obligation_eci boolean not null,
    parent        integer references indicateur_parent
) inherits (absract_modified_at);
comment on table indicateur_definition is 'Indicateur definition from markdown. Populated by business';



create table indicateur_action
(
    indicateur_id indicateur_id references indicateur_definition
        on delete cascade, -- if indicateur_definition is removed, indicateur_action will be deleted.
    action_id     action_id references action_relation
        on delete cascade, -- if action_relation is removed, indicateur_action will be deleted.
    primary key (indicateur_id, action_id)
) inherits (absract_modified_at);
comment on table indicateur_action is 'Indicateur <-> Action many-to-many relationship';


create table action_definition
(
    action_id   action_id primary key references action_relation,
    referentiel referentiel not null,
    identifiant text        not null,
    nom         text        not null,
    description text        not null,
    contexte    text        not null,
    exemples    text        not null,
    ressources  text        not null,
    points      float,
    pourcentage float
) inherits (absract_modified_at);
comment on table action_definition is 'Action definition from markdown. Populated by business';



create table action_computed_points
(
    action_id action_id primary key references action_relation,
    value     float not null
) inherits (absract_modified_at);

--------------------------------
----------- Données -------------
--------------------------------
create table abstract_any_indicateur_value
(
    valeur float   not null,
    annee  integer not null
) inherits (absract_modified_at);

create table indicateur_resultat
(
    id              serial primary key,
    collectivite_id integer references collectivite,
    indicateur_id   indicateur_id references indicateur_definition not null
) inherits (abstract_any_indicateur_value);

create table indicateur_objectif
(
    id              serial primary key,
    collectivite_id integer references collectivite,
    indicateur_id   indicateur_id references indicateur_definition
) inherits (abstract_any_indicateur_value);

create table indicateur_commentaire
(
    id              serial primary key,
    collectivite_id integer references collectivite,
    indicateur_id   indicateur_id references indicateur_definition not null,
    commentaire     text                                           not null,
    modified_by     uuid references auth.users default auth.uid()  not null
) inherits (absract_modified_at);


-- perso
create table indicateur_personnalise_definition
(
    id              serial primary key,
    collectivite_id integer references collectivite,
    titre           text                                          not null,
    description     text                                          not null,
    unite           text                                          not null,
    commentaire     text                                          not null,
    modified_by     uuid references auth.users default auth.uid() not null
) inherits (absract_modified_at);

create table indicateur_personnalise_resultat
(
    id                         serial primary key,
    collectivite_id            integer references collectivite,
    indicateur_personnalise_id integer references indicateur_personnalise_definition not null

) inherits (abstract_any_indicateur_value);

create table indicateur_personnalise_objectif
(
    id                         serial primary key,
    collectivite_id            integer references collectivite,
    indicateur_personnalise_id integer references indicateur_personnalise_definition not null

) inherits (abstract_any_indicateur_value);

create type fiche_action_avancement as enum ('pas_fait', 'fait', 'en_cours');

-- fiche action
create table fiche_action
(
    id                          serial primary key,
    collectivite_id             integer references collectivite,
    avancement                  fiche_action_avancement                           not null,
    numeration                  text                                              not null,
    titre                       text                                              not null,
    description                 text                                              not null,
    structure_pilote            text                                              not null,
    personne_referente          text                                              not null,
    elu_referent                text                                              not null,
    partenaires                 text                                              not null,
    budget_global               text                                              not null,
    commentaire                 text                                              not null,
    date_fin                    text                                              not null,
    date_debut                  text                                              not null,
    deleted                     boolean         default false                     not null,
    en_retard                   boolean         default false                     not null,
    -- relations to other tables
    action_ids                  action_id[]     default array []::action_id[]     not null,
    indicateur_ids              indicateur_id[] default array []::indicateur_id[] not null,
    indicateur_personnalise_ids integer[]       default array []::integer[]       not null
) inherits (absract_modified_at);
comment on table fiche_action is 'Fiche action used by the client';

create table fiche_action_action
(
    fiche_action_id integer references fiche_action,
    action_id       action_id references action_relation,
    primary key (fiche_action_id, action_id)
);
comment on table fiche_action is
    'Many-to-many relationship between fiche action and referentiel action';

create table fiche_action_indicateur
(
    fiche_action_id integer references fiche_action,
    indicateur_id   indicateur_id references indicateur_definition,
    primary key (fiche_action_id, indicateur_id)
);
comment on table fiche_action_indicateur is
    'Many-to-many relationship between fiche action and referentiel indicateur';

create table fiche_action_indicateur_personnalise
(
    fiche_action_id            integer references fiche_action,
    indicateur_personnalise_id integer references indicateur_personnalise_definition,
    primary key (fiche_action_id, indicateur_personnalise_id)
);
comment on table fiche_action_indicateur_personnalise is
    'Many-to-many relationship between fiche action and indicateur personnalisé';


create or replace function update_fiche_relationships(
    fiche_action_id integer,
    action_ids action_id[],
    indicateur_ids indicateur_id[],
    indicateur_personnalise_ids integer[]
) returns void as
$$
declare
    id integer;
    i  action_id;
    j  indicateur_id;
    k  integer;
begin
    -- the name fiche_action_id is ambiguous as it can refer to a column.
    select update_fiche_relationships.fiche_action_id into id;

    -- clear previous relationships
    delete from fiche_action_action where fiche_action_action.fiche_action_id = id;
    delete from fiche_action_indicateur where fiche_action_indicateur.fiche_action_id = id;
    delete from fiche_action_indicateur_personnalise where fiche_action_indicateur_personnalise.fiche_action_id = id;

    -- write relationships
    foreach i in array action_ids
        loop
            insert into fiche_action_action (fiche_action_id, action_id)
            values (id, i);
        end loop;

    foreach j in array indicateur_ids
        loop
            insert into fiche_action_indicateur (fiche_action_id, indicateur_id)
            values (id, j);
        end loop;

    foreach k in array indicateur_personnalise_ids
        loop
            insert into fiche_action_indicateur_personnalise (fiche_action_id, indicateur_personnalise_id)
            values (id, k);
        end loop;
end;
$$
    language plpgsql;
comment on function update_fiche_relationships is
    'Update fiche action relationships with actions, indicateurs and indicateurs personnalisés';


create or replace function after_fiche_action_write_save_relationships() returns trigger as
$$
begin
    perform update_fiche_relationships(
            new.id,
            new.action_ids,
            new.indicateur_ids,
            new.indicateur_personnalise_ids
        );
    return new;
end;
$$ language plpgsql;

create trigger after_fiche_action_write
    after insert or update
    on fiche_action
    for each row
execute procedure after_fiche_action_write_save_relationships();

comment on function after_fiche_action_write_save_relationships is
    'Save relationships with actions, indicateurs and indicateurs personnalisés '
        'from fiche action data on insert or update to ensure they are correct';
