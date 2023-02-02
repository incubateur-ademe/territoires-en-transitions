-- Deploy tet:retool/utilisateur to pg

BEGIN;

create function
    retool_user_list()
    returns table
            (
                droit_id     integer,
                nom          text,
                prenom       text,
                email        text,
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
    'Returns the user list for service role as an rpc for legacy reasons.';

create view retool_user_list
as
select d.id               as droit_id,
       nc.collectivite_id as collectivite_id,
       d.user_id          as user_id,
       nc.nom             as collectivite,
       d.role_name        as role,
       d.active           as active,
       p.nom              as nom,
       p.prenom           as prenom,
       p.email            as email
from private_utilisateur_droit d
         join dcp p on p.user_id = d.user_id
         join named_collectivite nc on d.collectivite_id = nc.collectivite_id
where is_service_role() -- Protect the DCPs.
;
comment on view retool_user_list is
    'The user list view for retool.';

create view retool_user_collectivites_list as
with droit as (select d.user_id as user_id, nc.nom as nom, nc.collectivite_id
               from private_utilisateur_droit d
                        join named_collectivite nc on d.collectivite_id = nc.collectivite_id),
     user_collectivites as (select d.user_id, array_agg(c.nom) as noms
                            from droit d
                                     join named_collectivite c on c.collectivite_id = d.collectivite_id
                            group by d.user_id)
select p.prenom                              as prenom,
       p.nom                                 as nom,
       p.email                               as email,
       u.created_at                          as creation,
       u.last_sign_in_at                     as derniere_connexion,
       uc.noms                               as collectivites,
       coalesce(array_length(uc.noms, 1), 0) as nb_collectivite
from dcp p
         left join user_collectivites uc on uc.user_id = p.user_id
         join auth.users u on u.id = p.user_id
where is_service_role() -- Protect the DCPs.
;
comment on view retool_user_collectivites_list is
    'Users droit by collectivite to activate/deactivate accesses.';

COMMIT;
