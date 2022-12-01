-- Deploy tet:referentiel/vues to pg
-- requires: referentiel/contenu
-- requires: utils/naturalsort

BEGIN;

create or replace view business_action_children
as
select referentiel, id, parent, children.ids as children
from action_relation as ar
         left join lateral (
    select array_agg(action_relation.id) as ids
    from action_relation
    where action_relation.parent = ar.id

    )
    as children on true;
comment on view business_action_children is
    'Action and its children, computed from action relation';


create or replace view action_children
as
with recursive
    actions_from_parents as
        -- +---------+-------------------+-----+
        -- |id       |parents            |depth|
        -- +---------+-------------------+-----+
        -- |eci_2.2.0|{eci,eci_2,eci_2.2}|3    |
        -- |eci_2.2.1|{eci,eci_2,eci_2.2}|3    |
        (
            -- Actions with no parent, our starting point
            select id, '{}'::action_id[] as parents, 0 as depth
            from action_relation
            where action_relation.parent is null

            union all

            -- Recursively find sub-actions and append them to the result-set
            select c.id, parents || c.parent, depth + 1
            from actions_from_parents p
                     join action_relation c
                          on c.parent = p.id
            where not c.id = any (parents)
        ),
    parent_child as
        -- +-----+-------+
        -- |p    |c      |
        -- +-----+-------+
        -- |cae  |cae_2  |
        -- |cae  |cae_6  |
        -- |cae_2|cae_2.1|
        (
            select parent.id as id, child.id as c
            from action_relation child
                     left join action_relation parent on parent.id = child.parent
        ),
    parent_children as
        -- +-------+-------------------------------------+
        -- |p      |children                             |
        -- +-------+-------------------------------------+
        -- |cae    |{cae_6,cae_1,cae_2,cae_4,cae_3,cae_5}|
        -- |cae_1  |{cae_1.1,cae_1.2,cae_1.3}            |
        -- |cae_1.1|{cae_1.1.2,cae_1.1.3,cae_1.1.1}      |
        (
            select id, array_agg(c) as children
            from parent_child
            group by id
        )
-- +---+-------------------------------------+-----+
-- |id |children                             |depth|
-- +---+-------------------------------------+-----+
-- |cae|{cae_4,cae_5,cae_2,cae_6,cae_1,cae_3}|0    |
-- |eci|{eci_2,eci_3,eci_4,eci_1,eci_5}      |0    |
select actions_from_parents.id                               as id,
       coalesce(parent_children.children, '{}'::action_id[]) as children,
       actions_from_parents.depth                            as depth
from actions_from_parents
         left join parent_children on actions_from_parents.id = parent_children.id
order by depth;


create or replace view action_definition_summary
as
select id,
       action_definition.referentiel,
       action_children.children,
       action_children.depth,
       coalesce(
               case
                   when referentiel = 'cae'
                       then ('{"axe", "sous-axe", "action", "sous-action", "tache"}'::action_type[])[action_children.depth]
                   else ('{"axe", "action", "sous-action", "tache"}'::action_type[])[action_children.depth]
                   end
           , 'referentiel') as type,
       identifiant,
       nom,
       description,
       exemples != '' as have_exemples,
       preuve != '' as have_preuve,
       ressources != '' as have_ressources,
       reduction_potentiel != '' as have_reduction_potentiel,
       perimetre_evaluation != '' as have_perimetre_evaluation,
       contexte != '' as have_contexte,
       id in (select action_id from question_action ) as have_questions,
       action_definition.categorie as phase
from action_definition
         join action_children on action_id = action_children.id
order by naturalsort(action_id);
comment on view action_definition_summary is
    'The minimum information to display an action';


create or replace view action_title
as
select id,
       referentiel,
       children,
       type,
       identifiant,
       nom
from action_definition_summary;
comment on view action_title is
    'Titles only';


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
          and action_definition_summary.depth <= referentiel_action_depth;
end;
$$ language plpgsql;
comment on function referentiel_down_to_action is 'Returns referentiel action summary down to the action level';


create or replace function action_down_to_tache(
    referentiel referentiel,
    identifiant text
)
    returns setof action_definition_summary as
$$
declare
    referentiel_action_depth integer;
begin
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
          and action_definition_summary.identifiant like action_down_to_tache.identifiant || '%'
          and action_definition_summary.depth >= referentiel_action_depth - 1;
end
$$ language plpgsql;
comment on function action_down_to_tache is 'Returns referentiel action summary down to the tache level';



create or replace function action_exemples(
    id action_id,
    out id action_id,
    out exemples text
)
as
$$
select action_definition.action_id, action_definition.exemples
from action_definition
where action_definition.action_id = action_exemples.id
$$ language sql stable;
comment on function action_exemples is 'Returns action "exemples" text';

create or replace function action_contexte(
    id action_id,
    out id action_id,
    out contexte text
)
as
$$
select action_definition.action_id, action_definition.contexte
from action_definition
where action_definition.action_id = action_contexte.id
$$ language sql stable;
comment on function action_contexte is 'Returns action "contexte" text';

create or replace function action_preuve(
    id action_id,
    out id action_id,
    out preuve text
)
as
$$
select action_definition.action_id, action_definition.preuve
from action_definition
where action_definition.action_id = action_preuve.id
$$ language sql stable;
comment on function action_preuve is 'Returns action "preuve" text';


create or replace function action_ressources(
    id action_id,
    out id action_id,
    out ressources text
)
as
$$
select action_definition.action_id, action_definition.ressources
from action_definition
where action_definition.action_id = action_ressources.id
$$ language sql stable;
comment on function action_ressources is 'Returns action "ressources" text';


create or replace function action_reduction_potentiel(
    id action_id,
    out id action_id,
    out reduction_potentiel text
)
as
$$
select action_definition.action_id, action_definition.reduction_potentiel
from action_definition
where action_definition.action_id = action_reduction_potentiel.id
$$ language sql stable;
comment on function action_reduction_potentiel is 'Returns action "reduction_potentiel" text';


create or replace function action_perimetre_evaluation(
    id action_id,
    out id action_id,
    out perimetre_evaluation text
)
as
$$
select action_definition.action_id, action_definition.perimetre_evaluation
from action_definition
where action_definition.action_id = action_perimetre_evaluation.id
$$ language sql stable;
comment on function action_perimetre_evaluation is 'Returns action "perimetre_evaluation" text';

COMMIT;
