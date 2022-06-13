-- Deploy tet:retool/evaluation to pg

BEGIN;

create view retool_completude_compute as
with active as (select *
                from retool_active_collectivite),
     completed_eci as (select c.collectivite_id, count(*) as count
                       from active c
                                join action_statut s on s.collectivite_id = c.collectivite_id
                                join action_relation r on r.id = s.action_id
                       where r.referentiel = 'eci'
                       group by c.collectivite_id),
     eci_count as (select count(*)
                   from action_relation r
                            join action_children c on r.id = c.id
                   where r.referentiel = 'eci'
                     and array_length(c.children, 1) is null),
     completed_cae as (select c.collectivite_id, count(*) as count
                       from active c
                                join action_statut s on s.collectivite_id = c.collectivite_id
                                join action_relation r on r.id = s.action_id
                       where r.referentiel = 'cae'
                       group by c.collectivite_id),
     cae_count as (select count(*)
                   from action_relation r
                            join action_children c on r.id = c.id
                   where r.referentiel = 'cae'
                     and array_length(c.children, 1) is null)
select c.collectivite_id,
       c.nom,
       round((compl_eci.count::decimal / c_eci.count::decimal) * 100, 2) as completude_eci,
       round((compl_cae.count::decimal / c_cae.count::decimal) * 100, 2) as completude_cae
from active c
         left join completed_eci compl_eci on compl_eci.collectivite_id = c.collectivite_id
         left join completed_cae compl_cae on compl_cae.collectivite_id = c.collectivite_id
         join eci_count c_eci on true
         join cae_count c_cae on true
;
comment on view retool_completude_compute is
    'Completude computed using statut over definition count.';


create view retool_score as
with relation as (select *
                  from action_relation),
     statut as (select *
                from action_statut a
                         join relation on relation.id = a.action_id),
     score as (select jsonb_array_elements(scores) ->> 'action_id'       as action_id,
                      jsonb_array_elements(scores) ->> 'point_fait'      as points,
                      jsonb_array_elements(scores) ->> 'point_potentiel' as points_pot,
                      s.collectivite_id
               from client_scores s),
     commentaires as (select *
                      from action_commentaire c
                               join relation on relation.id = c.action_id)
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
where is_service_role() -- Protect DCPs that could be in commentaires.
order by n.collectivite_id, a.id
;
comment on view retool_score is
    'Scores and commentaires for audit.';


create view retool_completude
as
with active as (select *
                from retool_active_collectivite),
     score as (select collectivite_id, jsonb_array_elements(scores) as o from client_scores),
     eci as (select collectivite_id,
                    (o ->> 'completed_taches_count')::integer as completed_taches_count,
                    (o ->> 'total_taches_count')::integer     as total_taches_count,
                    (o ->> 'point_fait')::float               as point_fait,
                    (o ->> 'point_programme')::float          as point_programme
             from score
             where o @> '{"action_id": "eci"}'),
     cae as (select collectivite_id,
                    (o ->> 'completed_taches_count')::integer as completed_taches_count,
                    (o ->> 'total_taches_count')::integer     as total_taches_count,
                    (o ->> 'point_fait')::float               as point_fait,
                    (o ->> 'point_programme')::float          as point_programme
             from score
             where o @> '{"action_id": "cae"}')

select c.collectivite_id,
       c.nom,
       cci.region_name,
       cci.departement_name,
       cci.type_collectivite,
       cci.population_totale,
       cci.code_siren_insee,
       (eci.completed_taches_count::float / eci.total_taches_count::float) * 100 as completude_eci,
       (cae.completed_taches_count::float / cae.total_taches_count::float) * 100 as completude_cae
from active c
         left join eci on eci.collectivite_id = c.collectivite_id
         left join cae on cae.collectivite_id = c.collectivite_id
         left join collectivite_carte_identite cci on cci.collectivite_id = c.collectivite_id
order by c.collectivite_id;
comment on view retool_completude
    is 'Completude computed from client scores';

COMMIT;
