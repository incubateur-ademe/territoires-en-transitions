create or replace function
    retool_user_list()
    returns table(
        droits private_utilisateur_droit,
        personne dcp
    )
as
$$
select d as droits, p as utlisateur
from private_utilisateur_droit d
    join dcp p on p.user_id = d.user_id
where is_service_role()
$$ language sql;
comment on function retool_user_list is
    'Returns the user list for service role.';
