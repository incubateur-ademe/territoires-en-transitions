--------------------------------
-------- REFERENTIEL -----------
--------------------------------
create type referentiel as enum ('eci', 'cae');
comment on type referentiel is 'An enum representing a referentiel';

create domain action_id as varchar(30);
comment on type action_id is 'A unique action id. ex: eci_1.1.1.1';


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
) inherits (absract_modified_at);
comment on table indicateur_definition is 'Indicateur definition from markdown. Populated by business';

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
) inherits (absract_modified_at);
comment on table indicateur_action is 'Indicateur <-> Action many-to-many relationship';

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
    points      float,
    pourcentage float
) inherits (absract_modified_at);
comment on table action_definition is 'Action definition from markdown. Populated by business';


alter table action_definition
    enable row level security;

create policy allow_read
    on action_definition
    for select
    using (true);

create view action_definition_summary
as
select action_id,
       referentiel,
       identifiant,
       nom,
       description
from action_definition
order by action_id;
comment on view action_definition_summary is
    'The minimum information from definition';


create table action_computed_points
(
    action_id action_id primary key references action_relation,
    value     float not null
) inherits (absract_modified_at);
comment on table action_computed_points is
    'Action points computed by the business';

alter table action_computed_points
    enable row level security;

create policy allow_read
    on action_computed_points
    for select
    using (true);


create or replace function referentiel_down_to_action(
    referentiel referentiel
)
    returns setof action_definition_summary as
$$
declare
    referentiel_action_depth integer;
begin
    if referentiel_down_to_action.referentiel = 'cae'
    then
        select 3 into referentiel_action_depth;
    else
        select 2 into referentiel_action_depth;
    end if;
    return query
        select *
        from action_definition_summary
        where action_definition_summary.referentiel = referentiel_down_to_action.referentiel
          and char_length(action_definition_summary.action_id) -
              char_length(replace(action_definition_summary.action_id, '.', ''))
            < referentiel_action_depth;
end;
$$ language plpgsql;
comment on function referentiel_down_to_action is 'Returns referentiel action summary down to the action level';


create or replace function action_down_to_tache(
    referentiel referentiel,
    action_id action_id
)
    returns setof action_definition_summary as
$$
declare
    referentiel_action_depth integer;
    id                       action_id;
begin
    -- action_id is ambiguous
    select action_down_to_tache.action_id into id;
    if action_down_to_tache.referentiel = 'cae'
    then
        select 3 into referentiel_action_depth;
    else
        select 2 into referentiel_action_depth;
    end if;
    return query
        select *
        from action_definition_summary
        where action_definition_summary.referentiel = action_down_to_tache.referentiel
          and action_definition_summary.action_id like id || '%'
          and char_length(action_definition_summary.action_id) -
              char_length(replace(action_definition_summary.action_id, '.', ''))
            >= referentiel_action_depth - 1;
end
$$ language plpgsql;
comment on function action_down_to_tache is 'Returns referentiel action summary down to the tache level';
