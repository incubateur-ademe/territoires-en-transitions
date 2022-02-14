create or replace function
    retool_user_list()
    returns table(
        droit_id integer,
        nom text,
        prenom text,
        email text,
        collectivite text
    )
as
$$
select d.id, p.nom, p.prenom, p.email, nc.nom
from private_utilisateur_droit d
    join dcp p on p.user_id = d.user_id
    join named_collectivite nc on d.collectivite_id = nc.collectivite_id
where is_service_role()
$$ language sql;
comment on function retool_user_list is
    'Returns the user list for service role.';
