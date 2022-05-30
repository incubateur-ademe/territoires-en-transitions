create or replace view action_hierarchy
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
            select id, referentiel, '{}'::action_id[] as parents, 0 as depth
            from action_relation
            where action_relation.parent is null

            union all

            -- Recursively find sub-actions and append them to the result-set
            select c.id, c.referentiel, parents || c.parent, depth + 1
            from actions_from_parents p
                     join action_relation c
                          on c.parent = p.id
            where not c.id = any (parents)),
    parent_descendants as
        -- +-------+---------------------------------------------+
        -- |p      |descendants                                  |
        -- +-------+---------------------------------------------+
        -- |cae    |{cae_2,cae_6,cae_3,cae_1,... cae_2.1.2.6,...}|
        -- |cae_1  |{cae_1.1,cae_1.2,cae_1.3,...,cae_1.2.4,...}  |
        -- |cae_1.1|{cae_1.1.2,cae_1.1.3,...,cae_1.1.3.3...}     |
        (select ar.id, array_agg(afp.id) as descendants
         from action_relation ar
                  join actions_from_parents afp on ar.id = any (afp.parents)
         group by ar.id)
-- +---+-------------------------------------+-----+
-- |id |children                             |depth|
-- +---+-------------------------------------+-----+
-- |cae|{cae_4,cae_5,cae_2,cae_6,cae_1,cae_3}|0    |
-- |eci|{eci_2,eci_3,eci_4,eci_1,eci_5}      |0    |
select actions_from_parents.id                                     as action_id,
       actions_from_parents.referentiel                            as referentiel,
       coalesce(parent_descendants.descendants, '{}'::action_id[]) as descendants,
       parent_descendants.descendants is not null                  as have_children,
       actions_from_parents.parents                                as ascendants,
       actions_from_parents.depth                                  as depth,
       coalesce(
               case
                   when actions_from_parents.referentiel = 'cae'
                       then ('{"axe", "sous-axe", "action", "sous-action", "tache"}'::action_type[])[actions_from_parents.depth]
                   else ('{"axe", "action", "sous-action", "tache"}'::action_type[])[actions_from_parents.depth]
                   end
           , 'referentiel')                                        as type
from actions_from_parents
         left join parent_descendants on actions_from_parents.id = parent_descendants.id
order by naturalsort(actions_from_parents.id);


create or replace view action_statuts
as
select
    -- client will filter on:
    c.id                                               as collectivite_id,
    d.action_id,
    d.referentiel,
    h.type,
    h.descendants,
    h.ascendants,
    h.depth,
    h.have_children,

    -- and optionally retrieve:
    d.identifiant,
    d.nom,
    d.description,
    d.exemples != ''                                   as have_exemples,
    d.preuve != ''                                     as have_preuve,
    d.ressources != ''                                 as have_ressources,
    d.reduction_potentiel != ''                        as have_reduction_potentiel,
    d.perimetre_evaluation != ''                       as have_perimetre_evaluation,
    d.contexte != ''                                   as have_contexte,

    -- action statuts:
    s.avancement,
    s.avancement_detaille,

    -- children status: the set of statuts of all children
    cs.avancements                                     as avancement_descendants,
    coalesce((not s.concerne), cs.non_concerne, false) as non_concerne

from collectivite c
         -- definitions
         left join action_definition d on true
         join action_hierarchy h on d.action_id = h.action_id
    -- collectivité data
         left join action_statut s on c.id = s.collectivite_id and s.action_id = d.action_id
         left join lateral (
    -- loop on every row to aggregate descendants statuts
    select case
               -- aucun descendant
               when h.descendants = '{}' then
                   '{}'::avancement[]
               -- aucun statut pour les enfants
               when count(*) = 0 then
                   '{non_renseigne}'::avancement[]
               -- des statuts mais pas pour chaque enfant
               when array_length(h.descendants, 1) != count(*) then
                   '{non_renseigne}'::avancement[] || array_agg(s.avancement)
               -- des statuts pour chaque enfant
               else
                   array_agg(s.avancement)
               end
               as avancements,
           not bool_and(s.concerne)
               as non_concerne
    from action_statut s
    where c.id = s.collectivite_id
      and s.action_id = any (h.descendants)
    ) cs on true
order by c.id,
         naturalsort(d.identifiant);
