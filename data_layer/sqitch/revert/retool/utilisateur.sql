-- Deploy tet:retool/utilisateur to pg

BEGIN;

create or replace view retool_user_collectivites_list as
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
