-- Deploy tet:plan_action/navigation to pg

BEGIN;

drop function flat_axes;
drop type flat_axe_node;
create type flat_axe_node as
(
    id        integer,
    nom       text,
    fiches    integer[],
    ancestors integer[],
    depth     integer,
    sort_path text
);

create function
    flat_axes(axe_id integer, max_depth integer default null)
    returns setof flat_axe_node
    stable
    security definer
    language plpgsql
as
$$
begin
    if not can_read_acces_restreint((select collectivite_id from axe where axe.id = flat_axes.axe_id)) then
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''a pas de droit en lecture sur la collectivité.';
    end if;

    return query
        with recursive
            parents as (select id,
                               coalesce(nom, '')         as nom,
                               collectivite_id,
                               0                         as depth,
                               array []::integer[]       as ancestors,
                               '0 ' || coalesce(nom, '') as sort_path

                        from axe
                        where id = axe_id
                          and can_read_acces_restreint(axe.collectivite_id)

                        union all

                        select a.id,
                               a.nom,
                               a.collectivite_id,
                               depth + 1,
                               ancestors || a.parent,
                               parents.sort_path || ' ' || depth + 1 || ' ' || coalesce(a.nom, '')
                        from parents
                                 join axe a on a.parent = parents.id),
            fiches as (select a.id,
                              array_agg(faa.fiche_id) as fiches
                       from parents a
                                join fiche_action_axe faa on a.id = faa.axe_id
                       group by a.id)
        select id, nom, fiches, ancestors, depth, sort_path
        from parents
                 left join fiches using (id)
        where case
                  when max_depth is not null
                      then depth <= max_depth
                  else true
                  end
        order by naturalsort(sort_path);
end
$$;
comment on function flat_axes is
    'Les axes ordonnancés par profondeur d''un plan donné sous forme de nodes prêtes pour reconstituer un arbre coté client.';

create function
    navigation_plans(collectivite_id integer)
    returns setof flat_axe_node
    stable
    language plpgsql
    security definer
as
$$
begin
    if not can_read_acces_restreint(navigation_plans.collectivite_id) then
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''a pas de droit en lecture sur la collectivité.';
    end if;

    return query
        select flat.*
        from axe a
                 join flat_axes(a.id, 1) flat on true
        where a.collectivite_id = navigation_plans.collectivite_id
          and a.parent is null
        order by naturalsort(sort_path);
end;
$$;
comment on function navigation_plans is
    'Les axes ordonnancés par profondeur d''une collectivité donnée pour la navigation.';

COMMIT;
