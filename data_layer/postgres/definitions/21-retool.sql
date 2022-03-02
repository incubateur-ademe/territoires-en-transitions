create or replace function
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
    'Returns the user list for service role.';


create or replace view retool_user_collectivites_list as
with droit as (
    select d.user_id as user_id, nc.nom as nom, nc.collectivite_id
    from private_utilisateur_droit d
             join named_collectivite nc on d.collectivite_id = nc.collectivite_id
)
select p.prenom                             as prenom,
       p.nom                                as nom,
       p.email                              as email,
       u.created_at                         as creation,
       u.last_sign_in_at                    as derniere_connexion,
       d.noms                               as collectivites,
       coalesce(array_length(d.noms, 1), 0) as nb_collectivite
from dcp p
         join auth.users u on u.id = p.user_id
         join lateral (
    select coalesce(array_agg(droit.nom), '{}') as noms
    from droit
    where droit.user_id = p.user_id) d on true
where is_service_role()
;


create or replace view retool_completude as
with active as (
    select n.nom, n.collectivite_id from named_collectivite n
    where collectivite_id in (select collectivite_id from private_utilisateur_droit where active)
), completed_eci as (
    select c.collectivite_id, count(*) as count
    from active c
        join action_statut s on s.collectivite_id = c.collectivite_id
        join action_relation r on r.id = s.action_id
    where r.referentiel = 'eci'
    group by c.collectivite_id
), eci_count as (
    select count(*)
    from action_relation r
        join action_children c on r.id = c.id
    where r.referentiel = 'eci' and array_length(c.children, 1) is null
), completed_cae as (
    select c.collectivite_id, count(*) as count
    from active c
        join action_statut s on s.collectivite_id = c.collectivite_id
        join action_relation r on r.id = s.action_id
    where r.referentiel = 'cae'
    group by c.collectivite_id
), cae_count as (
    select count(*)
    from action_relation r
        join action_children c on r.id = c.id
    where r.referentiel = 'cae' and array_length(c.children, 1) is null
)
select c.collectivite_id,
       c.nom,
       round( (compl_eci.count::decimal / c_eci.count::decimal) * 100, 2 ) as completude_eci,
       round( (compl_cae.count::decimal / c_cae.count::decimal) * 100, 2 ) as completude_cae
from active c
    left join completed_eci compl_eci on compl_eci.collectivite_id = c.collectivite_id
    left join completed_cae compl_cae on compl_cae.collectivite_id = c.collectivite_id
    join eci_count c_eci on true
    join cae_count c_cae on true
where is_service_role()
;

