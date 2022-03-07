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


create or replace view retool_completude_compute as
with active as (
    select n.nom, n.collectivite_id
    from named_collectivite n
    where collectivite_id in (select collectivite_id from private_utilisateur_droit where active)
),
     completed_eci as (
         select c.collectivite_id, count(*) as count
         from active c
                  join action_statut s on s.collectivite_id = c.collectivite_id
                  join action_relation r on r.id = s.action_id
         where r.referentiel = 'eci'
         group by c.collectivite_id
     ),
     eci_count as (
         select count(*)
         from action_relation r
                  join action_children c on r.id = c.id
         where r.referentiel = 'eci'
           and array_length(c.children, 1) is null
     ),
     completed_cae as (
         select c.collectivite_id, count(*) as count
         from active c
                  join action_statut s on s.collectivite_id = c.collectivite_id
                  join action_relation r on r.id = s.action_id
         where r.referentiel = 'cae'
         group by c.collectivite_id
     ),
     cae_count as (
         select count(*)
         from action_relation r
                  join action_children c on r.id = c.id
         where r.referentiel = 'cae'
           and array_length(c.children, 1) is null
     )
select c.collectivite_id,
       c.nom,
       round((compl_eci.count::decimal / c_eci.count::decimal) * 100, 2) as completude_eci,
       round((compl_cae.count::decimal / c_cae.count::decimal) * 100, 2) as completude_cae
from active c
         left join completed_eci compl_eci on compl_eci.collectivite_id = c.collectivite_id
         left join completed_cae compl_cae on compl_cae.collectivite_id = c.collectivite_id
         join eci_count c_eci on true
         join cae_count c_cae on true
where is_service_role()
;


create or replace view retool_score as
with relation as (
    select *
    from action_relation
),
     statut as (
         select *
         from action_statut a
                  join relation on relation.id = a.action_id
     ),
     score as (
         select json_array_elements(scores) ->> 'action_id'       as action_id,
                json_array_elements(scores) ->> 'point_fait'      as points,
                json_array_elements(scores) ->> 'point_potentiel' as points_pot,
                s.collectivite_id
         from client_scores s
     ),
     commentaires as (
         select *
         from action_commentaire c
                  join relation on relation.id = c.action_id
     )
select n.collectivite_id,
       n.nom                            as collectivité,
       a.referentiel,
       a.id                             as action,
       coalesce(s.avancement::text, '') as avancement,
       score.points                     as points,
       score.points_pot                 as points_potentiels,
       coalesce(
                       score.points::numeric / nullif(score.points_pot::numeric, 0)::float * 100.0,
                       0.0)             as pourcentage,
       coalesce(c.commentaire, '')      as commentaire

from named_collectivite n
         full join relation a on true
         left join statut s on s.action_id = a.id and s.collectivite_id = n.collectivite_id
         left join score on score.action_id = a.id and score.collectivite_id = n.collectivite_id
         left join commentaires c on c.action_id = a.id and c.collectivite_id = n.collectivite_id
where is_service_role()
order by n.collectivite_id, a.id
;




create view retool_completude
as
with active as (
    select c.collectivite_id,
           nom
    from named_collectivite c
             join private_utilisateur_droit d on d.collectivite_id = c.collectivite_id
    where d.active
),
     score as (
         select collectivite_id, jsonb_array_elements(scores) as o from client_scores
     ),
     eci as (
         select collectivite_id,
                (o ->> 'completed_taches_count')::integer as completed_taches_count,
                (o ->> 'total_taches_count')::integer     as total_taches_count,
                (o ->> 'point_fait')::float               as point_fait,
                (o ->> 'point_programme')::float          as point_programme
         from score
         where o @> '{"action_id": "eci"}'
     ),
     cae as (
         select collectivite_id,
                (o ->> 'completed_taches_count')::integer as completed_taches_count,
                (o ->> 'total_taches_count')::integer     as total_taches_count,
                (o ->> 'point_fait')::float               as point_fait,
                (o ->> 'point_programme')::float          as point_programme
         from score
         where o @> '{"action_id": "cae"}'
     )

select c.collectivite_id,
       c.nom,
       eci.completed_taches_count / eci.total_taches_count as completude_eci,
       cae.completed_taches_count / cae.total_taches_count as completude_cae
from active c
         left join eci on eci.collectivite_id = c.collectivite_id
         left join cae on cae.collectivite_id = c.collectivite_id
order by c.collectivite_id
;


