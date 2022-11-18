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
with p as (select collectivite_id,
                  action_id,
                  array_agg(coalesce(preuve.url, preuve.filename)) as preuves
           from preuve
           group by collectivite_id, action_id)
select c.collectivite_id                                              as collectivite_id,
       c.nom                                                          as "Collectivité",

       d.referentiel,
       d.identifiant                                                  as "Identifiant",
       d.nom                                                          as "Titre",
       sc.point_potentiel                                             as "Points potentiels",
       sc.point_fait                                                  as "Points realisés",

       case
           when sc.point_potentiel = 0 then 0
           else sc.point_fait / sc.point_potentiel * 100 end          as "Pourcentage réalisé",

       case
           when sc.point_potentiel = 0 then 0
           else sc.point_non_renseigne / sc.point_potentiel * 100 end as "Pourcentage non renseigné",

       coalesce(s.avancement::varchar, '')                            as "Avancement",
       not sc.concerne or sc.desactive                                as "Non concerné",
       ac.commentaire                                                 as "Commentaire",
       p.preuves                                                      as "Preuves"

from named_collectivite c
         -- definitions
         left join action_definition d on true
    -- collectivité data
         left join action_statut s on c.collectivite_id = s.collectivite_id and s.action_id = d.action_id
         left join private.action_scores sc on c.collectivite_id = sc.collectivite_id and sc.action_id = d.action_id
         left join p on c.collectivite_id = p.collectivite_id and d.action_id = p.action_id
         left join action_commentaire ac on d.action_id = ac.action_id and c.collectivite_id = ac.collectivite_id

order by c.collectivite_id,
         naturalsort(d.identifiant);

comment on view retool_score is
    'Scores et colonnes nécessaire pour les exports retool pour les audits.';


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
