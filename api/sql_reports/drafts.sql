-- fiches
--- per epci
with counts as (
    select epci_id, count(*) count
    from ficheaction
    where latest
      and not deleted
      and epci_id != 'test'
    group by epci_id
)
select nom, count
from counts
         join epci on epci_id = epci.uid
where count > :count
order by count desc;

--- count epcis above threshold
with counts as (
    select epci_id, count(*) count
    from ficheaction
    where latest
      and not deleted
      and epci_id != 'test'
    group by epci_id
)
select count(*)
from counts
where count > :count;

-- droits
--- accounts creation
with daily as (
    select created_at::date as day, count(created_at) as count
    from utilisateurdroits
        where created_at > '2021-06-1' and created_at < '2021-12-1'
    group by day
)
select day,
       count,
       sum(count) over (order by day rows between unbounded preceding and current row)
from daily;


-- activity
with fiches as (
    select epci_id, modified_at
    from ficheaction
    where modified_at > now() - interval :time
),
     statuts as (
         select epci_id, modified_at
         from actionstatus
         where modified_at > now() - interval :time
     )
select epci.nom, count(*) as modifications
from epci
         join fiches on fiches.epci_id = epci.uid
         join statuts on statuts.epci_id = epci.uid
group by rollup (epci.nom)
order by modifications;



-- page stats
--- trucs crées
with fiches as (
    select epci_id, count(epci_id) as count
    from ficheaction
    where latest
    group by epci_id
),
     statuts as (
         select epci_id, count(epci_id) as count
         from actionstatus
         where latest
         group by epci_id
     ),
     indicateurs as (
         select epci_id, count(epci_id) as count
         from indicateurresultat
         where latest
         group by epci_id
     ),
     indicateurs_perso as (
         select epci_id, count(epci_id) as count
         from indicateurpersonnaliseresultat
         where latest
         group by epci_id
     ),
     utilisateurs as (
         select epci_id, count(epci_id) as count
         from utilisateurdroits
         where latest
         group by epci_id
     )

select *
from (
         select nom,
                uid,
                coalesce(fiches.count, 0)            as fiches,
                coalesce(statuts.count, 0)           as statuts,
                coalesce(indicateurs.count, 0)       as indicateurs_referentiels,
                coalesce(indicateurs_perso.count, 0) as indicateurs_perso,
                coalesce(utilisateurs.count, 0)      as utilisateurs
         from epci
                  full join fiches on fiches.epci_id = uid
                  full join statuts on statuts.epci_id = uid
                  full join indicateurs on indicateurs.epci_id = uid
                  full join indicateurs_perso on indicateurs_perso.epci_id = uid
                  full join utilisateurs on utilisateurs.epci_id = uid
     ) as per_epci
where utilisateurs > 0
  and uid is not null;

--- moyennes par collectivite.
with fiches as (
    select epci_id, count(epci_id) as count
    from ficheaction
    where latest
    group by epci_id
),
     statuts as (
         select epci_id, count(epci_id) as count
         from actionstatus
         where latest
         group by epci_id
     ),
     indicateurs as (
         select epci_id, count(epci_id) as count
         from indicateurresultat
         where latest
         group by epci_id
     ),
     indicateurs_perso as (
         select epci_id, count(epci_id) as count
         from indicateurpersonnaliseresultat
         where latest
         group by epci_id
     ),
     utilisateurs as (
         select epci_id, count(epci_id) as count
         from utilisateurdroits
         where latest
         group by epci_id
     )


select avg(coalesce(fiches, 0))                   as fiches_avg,
       avg(coalesce(statuts, 0))                  as status_avg,
       avg(coalesce(indicateurs_referentiels, 0)) as indicateurs_referentiels_avg,
       avg(coalesce(indicateurs_perso, 0))        as indicateurs_perso_avg
from (
         select (fiches.count >= 5)::integer            as fiches,
                (statuts.count >= 20)::integer          as statuts,
                (indicateurs.count >= 5)::integer       as indicateurs_referentiels,
                (indicateurs_perso.count >= 1)::integer as indicateurs_perso
         from epci
                  full join fiches on fiches.epci_id = uid
                  full join statuts on statuts.epci_id = uid
                  full join indicateurs on indicateurs.epci_id = uid
                  full join indicateurs_perso on indicateurs_perso.epci_id = uid
                  full join utilisateurs on utilisateurs.epci_id = uid
         where utilisateurs.epci_id is not null
     ) as per_epci;
;
-- todo find missing epcis
with thing as (
    select epci_id
    from indicateurvalue
    where latest
)
select epci_id as lost
from epci

         full join thing on epci_id = epci.uid
where epci.uid is null;

select *
from epci
where uid = 'saint_louis_agglo';
select *
from utilisateurdroits
where epci_id = 'saint_louis_agglo';


--- nombre de collectivités avec un utilisateur

--- nombre d'utilisateurs (creation de compte)
with daily as (
    select created_at::date as day, count(created_at) as count
    from utilisateurdroits
    group by day
)
select day,
       count,
       sum(count) over (order by day rows between unbounded preceding and current row)
from daily;

--- nombre de fiche moy par collectivite
-----
with by_epcis as (
    select epci_id, count(epci_id) as count, created_at::date as day
    from ficheaction
    group by day, epci_id
)
select day, count, sum(count) over (order by day rows between unbounded preceding and current row)
from by_epcis;


--- nombre de statuts moyen par collectivite


--- nombre de valeur d'incateur moyen par collectivite
