-- Deploy tet:referentiel/vues to pg
-- requires: referentiel/contenu
-- requires: utils/naturalsort

BEGIN;

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
           , 'referentiel')                          as type,
       identifiant,
       nom,
       description,
       exemples != ''                                as have_exemples,
       preuve != ''                                  as have_preuve,
       ressources != ''                              as have_ressources,
       reduction_potentiel != ''                     as have_reduction_potentiel,
       perimetre_evaluation != ''                    as have_perimetre_evaluation,
       contexte != ''                                as have_contexte,
       id in (select action_id from question_action) as have_questions,
       action_definition.categorie                   as phase
from action_definition
         join action_children on action_id = action_children.id
order by naturalsort(action_id);
comment on view action_definition_summary is
    'Les informations affichées dans le client';

COMMIT;
