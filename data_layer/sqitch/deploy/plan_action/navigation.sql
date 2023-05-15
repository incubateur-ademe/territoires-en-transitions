-- Deploy tet:plan_action/navigation to pg

BEGIN;

drop function flat_axes;
create function
    flat_axes(axe_id integer, max_depth integer default null)
    returns setof flat_axe_node
    stable
begin
    atomic
    with recursive
        parents as (select id,
                           nom,
                           collectivite_id,
                           0                   as depth,
                           array []::integer[] as ancestors
                    from axe
                    where id = axe_id
                      and can_read_acces_restreint(axe.collectivite_id)

                    union all

                    select a.id,
                           a.nom,
                           a.collectivite_id,
                           depth + 1,
                           ancestors || a.parent
                    from parents
                             join axe a on a.parent = parents.id),
        fiches as (select a.id,
                          array_agg(faa.fiche_id) as fiches
                   from parents a
                            join fiche_action_axe faa on a.id = faa.axe_id
                   group by a.id)
    select id, nom, fiches, ancestors, depth
    from parents
             left join fiches using (id)
    where case
              when max_depth is not null
                  then depth <= max_depth
              else true
              end
    order by depth, naturalsort(nom);
end;
comment on function flat_axes is
    'Les axes ordonnancés par profondeur d''un plan donné sous forme de nodes prêtes pour reconstituer un arbre coté client.';

create function
    navigation_plans(collectivite_id integer)
    returns setof flat_axe_node
    stable
begin
    atomic
    select flat.*
    from axe a
             join flat_axes(a.id, 1) flat on true
    where a.collectivite_id = navigation_plans.collectivite_id
      and a.parent is null;
end;
comment on function navigation_plans is
    'Les axes ordonnancés par profondeur d''une collectivité donnée pour la navigation.';

COMMIT;
