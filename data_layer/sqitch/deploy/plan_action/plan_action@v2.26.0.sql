-- Deploy tet:plan_action to pg

BEGIN;

create type flat_axe_node as
(
    id        integer,
    nom       text,
    fiches    integer[],
    ancestors integer[],
    depth     integer
);

create function
    flat_axes(plan_id integer)
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
                    where parent is null
                      and id = plan_id
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
    order by depth, naturalsort(nom);
end;
comment on function flat_axes is
    'Les axes ordonnancés par profondeur d''un plan donné sous forme de nodes prêtes pour reconstituer un arbre coté client.';

COMMIT;
