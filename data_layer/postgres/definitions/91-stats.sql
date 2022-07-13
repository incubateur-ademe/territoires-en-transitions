create or replace view stats_real_collectivites
as
select *
from named_collectivite
where collectivite_id not in (select collectivite_id from collectivite_test);

create or replace view stats_rattachements
as
with daily as (
    select created_at::date as day, count(created_at) as count
    from private_utilisateur_droit d
             join stats_real_collectivites c on d.collectivite_id = c.collectivite_id
    group by day
)
select day                                                                                      as date,
       count,
       sum(count) over (order by day rows between unbounded preceding and current row)::integer as cumulated_count
from daily;


create or replace view stats_unique_active_collectivite
as
with unique_collectivite_droit as (
    select d.collectivite_id, min(created_at) as created_at
    from private_utilisateur_droit d
             join stats_real_collectivites c on d.collectivite_id = c.collectivite_id and active
    group by d.collectivite_id
),
     daily as (
         select created_at::date as day, count(created_at) as count
         from unique_collectivite_droit d
                  join stats_real_collectivites c on d.collectivite_id = c.collectivite_id
         group by day
     )
select day                                                                                      as date,
       count,
       sum(count) over (order by day rows between unbounded preceding and current row)::integer as cumulated_count
from daily;

create or replace view stats_unique_active_users
as
with unique_user_droit as (
    select user_id, min(created_at) as created_at
    from private_utilisateur_droit d
             join stats_real_collectivites c on d.collectivite_id = c.collectivite_id
    group by user_id
),
     daily as (
         select created_at::date as day, count(created_at) as count
         from unique_user_droit d
         group by day
     )
select day                                                                                      as date,
       count,
       sum(count) over (order by day rows between unbounded preceding and current row)::integer as cumulated_count
from daily;


create or replace view stats_functionnalities_usage_proportion as
(
with active_collectivite as (
    select distinct collectivite_id
    from private_utilisateur_droit
    where active
),
     fiches as (
         select collectivite_id,
                count(collectivite_id) as count
         from fiche_action
         group by collectivite_id
     ),
     eci_statuses as (
         select collectivite_id,
                count(collectivite_id) as count
         from action_statut a_s
                  join action_relation a_r on a_r.id = a_s.action_id
         where a_r.referentiel = 'eci'
         group by collectivite_id
     ),
     cae_statuses as (
         select collectivite_id,
                count(collectivite_id) as count
         from action_statut a_s
                  join action_relation a_r on a_r.id = a_s.action_id
         where a_r.referentiel = 'cae'
         group by collectivite_id
     ),
     indicateurs as (
         select collectivite_id,
                count(collectivite_id) as count
         from indicateur_resultat
         group by collectivite_id
     ),
     indicateurs_perso as (
         select collectivite_id,
                count(collectivite_id) as count
         from indicateur_personnalise_resultat
         group by collectivite_id
     ),
     utilisateurs as (
         select collectivite_id,
                count(collectivite_id) as count
         from private_utilisateur_droit
         where active
         group by collectivite_id
     )
select avg(coalesce(fiches, 0))                   as fiche_action_avg,
       avg(coalesce(cae_statuses, 0))             as cae_statuses_avg,
       avg(coalesce(eci_statuses, 0))             as eci_statuses_avg,
       avg(coalesce(indicateurs_referentiels, 0)) as indicateur_referentiel_avg,
       avg(coalesce(indicateurs_perso, 0))        as indicateur_personnalise_avg
from (
         select (fiches.count >= 5)::integer            as fiches,
                (eci_statuses.count >= 20)::integer     as eci_statuses,
                (cae_statuses.count >= 20)::integer     as cae_statuses,
                (indicateurs.count >= 5)::integer       as indicateurs_referentiels,
                (indicateurs_perso.count >= 1)::integer as indicateurs_perso
         from active_collectivite a_c
                  full join fiches on fiches.collectivite_id = a_c.collectivite_id
                  full join eci_statuses on eci_statuses.collectivite_id = a_c.collectivite_id
                  full join cae_statuses on cae_statuses.collectivite_id = a_c.collectivite_id
                  full join indicateurs on indicateurs.collectivite_id = a_c.collectivite_id
                  full join indicateurs_perso on indicateurs_perso.collectivite_id = a_c.collectivite_id
                  full join utilisateurs on utilisateurs.collectivite_id = a_c.collectivite_id
         where utilisateurs.collectivite_id is not null
     ) as per_collectivite
    );

create or replace view stats_tranche_completude
as
with completude as (
    select coalesce(completude_eci, .0) as completude_eci,
           coalesce(completude_cae, .0) as completude_cae
    from retool_completude
),
     range as (
         select unnest('{0,       0.00001, 50, 80,  100}'::float[])         as start,
                unnest('{0.00001, 50,      80, 100, 100.1}'::float[]) as "end"
     ),
     eci as (
         select r.start, count(eci.*) as count
         from range r
                  left join completude eci on eci.completude_eci >= start and eci.completude_eci < "end"
         group by r.start
     ),
     cae as (
         select r.start, count(cae.*) as count
         from range r
                  left join completude cae on cae.completude_cae >= start and cae.completude_cae < "end"
         group by r.start
     )
select range.start::int || ':' || range."end"::int as bucket, eci.count as eci, cae.count as cae
from range
         left join eci on eci.start = range.start
         left join cae on cae.start = range.start
order by range.start
;

