-- Deploy tet:evaluation/question_display to pg
-- requires: collectivite/identite

BEGIN;

create view question_display as
with actions as (select question_id, array_agg(action_id) action_ids
                 from question_action
                 group by question_id),
     q as (select q.id    as id,
                  a.action_ids,
                  thematique_id,
                  type,
                  t.nom   as thematique_nom,
                  description,
                  types_collectivites_concernees,
                  formulation,
                  ordonnancement,
                  cx.json as choix
           from question q
                    join question_thematique t on t.id = q.thematique_id
                    join actions a on q.id = a.question_id
                    left join lateral (select array_agg(
                                                      json_build_object(
                                                              'id', c.id,
                                                              'label', c.formulation,
                                                              'ordonnancement', c.ordonnancement
                                                          )) as json
                                       from question_choix c
                                       where c.question_id = q.id) cx on true)
select q.id,
       action_ids,
       i.id as collectivite_id,
       thematique_id,
       q.type,
       thematique_nom,
       description,
       types_collectivites_concernees,
       formulation,
       ordonnancement,
       choix,
       population,
       localisation
from q
         join collectivite_identite i
              on q.types_collectivites_concernees && i.type
                  or q.types_collectivites_concernees is null;
comment on view question_display is
    'Questions avec leurs choix par collectivité pour l''affichage dans le client';

COMMIT;
