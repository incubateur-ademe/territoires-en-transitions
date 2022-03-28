create or replace view collectivite_identite as
with population_commune as (
    select com.collectivite_id,
           case
               when ptot < 5000 then '{"moins_de_5000", "moins_de_10000", "moins_de_100000"}'
               when ptot < 10000 then '{"moins_de_10000", "moins_de_100000"}'
               when ptot < 100000 then '{"moins_de_100000"}'
               else '{}'
               end as population
    from commune com
             left join raw.population2019 pop on pop.com = com.code
),
     type_collectivite as (
         select c.id    as collectivite_id,
                case
                    when c.id in (select collectivite_id from commune) then '{"commune"}'
                    else '{"EPCI"}'
                    end as type
         from collectivite c
     )
select c.id,
       coalesce(pc.population, '{}')                as population,
       coalesce(tc.type, '{}')::type_collectivite[] as type,        -- todo incomplete
       '{}'                                         as localisation -- todo incomplete
from collectivite c
         left join population_commune pc on pc.collectivite_id = c.id
         left join type_collectivite tc on tc.collectivite_id = c.id
;

create view question_display as
with actions as (
    select question_id, array_agg(action_id) action_ids
    from question_action
    group by question_id
), q as (
    select q.id    as id,
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
                                where c.question_id = q.id) cx on true
)
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
    join collectivite_identite i on q.types_collectivites_concernees && i.type
;
comment on view question_display is
    'Questions avec leurs choix pour l''affichage dans le client';



