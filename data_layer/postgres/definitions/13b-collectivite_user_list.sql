create or replace function collectivite_user_list(id integer)
    returns table (role_name role_name, personnes dcp[] )
as
$$ select d.role_name as role_name, array_agg(p) as personnes
    from private_utilisateur_droit d
             join dcp p on p.user_id = d.user_id
    where d.collectivite_id = collectivite_user_list.id
      and is_any_role_on(collectivite_user_list.id)
    group by d.role_name;

$$
    language sql
    security definer;
