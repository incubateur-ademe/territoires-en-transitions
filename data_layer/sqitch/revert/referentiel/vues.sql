-- Deploy tet:referentiel/vues to pg
-- requires: referentiel/contenu
-- requires: utils/naturalsort

BEGIN;

drop function action_down_to_tache;
drop function referentiel_down_to_action;
drop view action_title;
drop view action_definition_summary;

create view action_definition_summary
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
       id in (select action_id from question_action ) as have_questions
from action_definition
         join action_children on action_id = action_children.id
order by naturalsort(action_id);
comment on view action_definition_summary is
    'The minimum information to display an action';

create function action_down_to_tache(
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


create function referentiel_down_to_action(
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

create view action_title
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

COMMIT;
