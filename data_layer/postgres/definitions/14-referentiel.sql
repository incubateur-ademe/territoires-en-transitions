--------------------------------
-------- REFERENTIEL -----------
--------------------------------
create type referentiel as enum ('eci', 'cae');
comment on type referentiel is 'An enum representing a referentiel';

create domain action_id as varchar(30);
comment on type action_id is 'A unique action id. ex: eci_1.1.1.1';

create type  action_type as enum ('referentiel','axe', 'sous-axe', 'action', 'sous-action', 'tache');
comment on type action_type is 'An action type, or the name of it''s level';

--------------------------------
------ ACTION RELATION ---------
--------------------------------
create table action_relation
(
    id          action_id primary key,
    referentiel referentiel not null,
    parent      action_id references action_relation
);
comment on table action_relation is
    'Relation between an action and its parent. '
        'Parent must be inserted before its child; child must be deleted before its parent.';

alter table action_relation
    enable row level security;

create policy allow_read
    on action_relation
    for select
    using (true);


--------------------------------
--------- INDICATEUR -----------
--------------------------------
create type indicateur_group as enum ('cae', 'crte', 'eci');

create table indicateur_parent
(
    id     serial primary key,
    numero text unique not null,
    nom    text        not null
);
comment on table indicateur_parent is 'An optional parent used to group indicateurs together.';

alter table indicateur_parent
    enable row level security;

create policy allow_read
    on indicateur_parent
    for select
    using (true);


create domain indicateur_id as varchar(30);
create table indicateur_definition
(
    id                indicateur_id primary key,
    indicateur_group  indicateur_group not null,
    identifiant       text             not null,
    valeur_indicateur indicateur_id references indicateur_definition,
    nom               text             not null,
    description       text             not null,
    unite             text             not null,
    obligation_eci    boolean          not null,
    parent            integer references indicateur_parent
) inherits (abstract_modified_at);
comment on table indicateur_definition is 'Indicateur definition from markdown. Populated by business';

create trigger set_modified_at_before_indicateur_definition_update
    before update
    on
        indicateur_definition
    for each row
execute procedure update_modified_at();

alter table indicateur_definition
    enable row level security;

create policy allow_read
    on indicateur_definition
    for select
    using (true);


create table indicateur_action
(
    indicateur_id indicateur_id references indicateur_definition
        on delete cascade, -- if indicateur_definition is removed, indicateur_action will be deleted.
    action_id     action_id references action_relation
        on delete cascade, -- if action_relation is removed, indicateur_action will be deleted.
    primary key (indicateur_id, action_id)
) inherits (abstract_modified_at);
comment on table indicateur_action is 'Indicateur <-> Action many-to-many relationship';

create trigger set_modified_at_before_indicateur_action_update
    before update
    on
        indicateur_action
    for each row
execute procedure update_modified_at();

alter table indicateur_action
    enable row level security;

create policy allow_read
    on indicateur_action
    for select
    using (true);


--------------------------------
----------- ACTION -------------
--------------------------------
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
    reduction_potentiel text not null,
    perimetre_evaluation text not null,
    preuve      text        not null,
    points      float,
    pourcentage float
) inherits (abstract_modified_at);
comment on table action_definition is 'Action definition from markdown. Populated by business';

create trigger set_modified_at_before_action_definition_update
    before update
    on
        action_definition
    for each row
execute procedure update_modified_at();

alter table action_definition
    enable row level security;

create policy allow_read
    on action_definition
    for select
    using (true);

create table action_computed_points
(
    action_id action_id primary key references action_relation,
    value     float not null
) inherits (abstract_modified_at);
comment on table action_computed_points is
    'Action points computed by the business';

create trigger set_modified_at_before_action_computed_points_update
    before update
    on
        action_computed_points
    for each row
execute procedure update_modified_at();

alter table action_computed_points
    enable row level security;

create policy allow_read
    on action_computed_points
    for select
    using (true);

