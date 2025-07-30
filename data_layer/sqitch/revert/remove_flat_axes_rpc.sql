-- Recreate flat_axes function
CREATE OR REPLACE FUNCTION flat_axes(axe_id integer, max_depth integer DEFAULT NULL)
    RETURNS TABLE
            (
                id         integer,
                nom        text,
                fiches     integer[],
                ancestors  integer[],
                depth      integer,
                sort_path  text
            )
    LANGUAGE plpgsql
    SECURITY DEFINER
AS
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