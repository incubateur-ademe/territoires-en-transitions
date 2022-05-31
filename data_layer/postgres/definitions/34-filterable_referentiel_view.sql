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
         group by ar.id),
    parent_leaves as
        -- +-------+---------------------------------------------+
        -- |p      |descendants                                  |
        -- +-------+---------------------------------------------+
        -- |cae    |{cae_2,cae_6,cae_3,cae_1,... cae_2.1.2.6,...}|
        -- |cae_1  |{cae_1.1,cae_1.2,cae_1.3,...,cae_1.2.4,...}  |
        -- |cae_1.1|{cae_1.1.2,cae_1.1.3,...,cae_1.1.3.3...}     |
        (select ar.id,
                array_agg(afp.id) filter ( where d is null ) as leaves
         from action_relation ar
                  join actions_from_parents afp on ar.id = any (afp.parents)
                  left join parent_descendants d on d.id = afp.id
         group by ar.id)
-- +---+-------------------------------------+-----+
-- |id |children                             |depth|
-- +---+-------------------------------------+-----+
-- |cae|{cae_4,cae_5,cae_2,cae_6,cae_1,cae_3}|0    |
-- |eci|{eci_2,eci_3,eci_4,eci_1,eci_5}      |0    |
select actions_from_parents.id                                     as action_id,
       actions_from_parents.referentiel                            as referentiel,
       coalesce(parent_descendants.descendants, '{}'::action_id[]) as descendants,
       coalesce(parent_leaves.leaves, '{}'::action_id[])           as leaves,
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
         left join parent_leaves on parent_leaves.id = parent_descendants.id
order by naturalsort(actions_from_parents.id);


create or replace view private.action_scores
as
select cs.collectivite_id,
       unpacked.*
from client_scores cs
         join lateral (select * from private.convert_client_scores(cs.scores)) unpacked on true;


create or replace view action_statuts
as
select
    -- client will filter on:
    c.id                                                      as collectivite_id,
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
    d.exemples != ''                                          as have_exemples,
    d.preuve != ''                                            as have_preuve,
    d.ressources != ''                                        as have_ressources,
    d.reduction_potentiel != ''                               as have_reduction_potentiel,
    d.perimetre_evaluation != ''                              as have_perimetre_evaluation,
    d.contexte != ''                                          as have_contexte,
    d.categorie                                               as phase,

    -- score [0.0, 1.0]
    sc.point_fait / sc.point_potentiel                        as score_realise,
    sc.point_programme / sc.point_potentiel                   as score_programme,
    (sc.point_fait + sc.point_programme) / sc.point_potentiel as score_realise_plus_programme,
    sc.point_pas_fait / sc.point_potentiel                    as score_pas_fait,
    sc.point_non_renseigne / sc.point_potentiel               as score_non_renseigne,

    -- points
    sc.point_potentiel - sc.point_fait                        as points_restants,
    sc.point_fait                                             as points_realises,
    sc.point_programme                                        as points_programmes,
    sc.point_potentiel                                        as points_max_personnalises,
    sc.point_referentiel                                      as points_max_referentiel,

    -- action statuts
    s.avancement,
    s.avancement_detaille,

    -- children status: the set of statuts of all children
    cs.avancements                                            as avancement_descendants,
    coalesce((not s.concerne), cs.non_concerne, false)        as non_concerne

from collectivite c
         -- definitions
         left join action_definition d on true
         join action_hierarchy h on d.action_id = h.action_id
    -- collectivité data
         left join action_statut s on c.id = s.collectivite_id and s.action_id = d.action_id
         left join private.action_scores sc on c.id = sc.collectivite_id and sc.action_id = d.action_id
    -- loop on every row to aggregate descendants statuts
         left join lateral (
    select case
               -- aucun descendant
               when not h.have_children then
                   '{}'::avancement[]
               -- aucun statut pour les enfants
               when sc.point_non_renseigne = sc.point_potentiel then
                   '{non_renseigne}'::avancement[]
               -- des statuts mais pas pour chaque enfant
               when sc.point_non_renseigne > 0.0 then
                       '{non_renseigne}'::avancement[] ||
                       array_agg(distinct statut.avancement) filter ( where statut.concerne )
               -- des statuts pour chaque enfant
               else
                   array_agg(distinct statut.avancement) filter ( where statut.concerne )
               end
               as avancements,
           not bool_and(statut.concerne)
               as non_concerne
    from action_statut statut
    where c.id = statut.collectivite_id
      and statut.action_id = any (h.leaves)
    ) cs on true
-- remove `desactive` and `non concernes` in one fell swoop.
where sc is null
   or (sc.concerne and not sc.desactive)
order by c.id,
         naturalsort(d.identifiant);
