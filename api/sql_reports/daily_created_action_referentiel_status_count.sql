with real_epci as (
    select uid
    from epci
    where siren != ''
),
     statut as (
         select action_id like 'citergie%' as cae,
                action_id like 'economie%' as eci,
                epci_id,
                created_at
         from actionstatus
                  join real_epci on real_epci.uid = actionstatus.epci_id
         where real_epci.uid is not null
     ),

     daily as (
         select created_at::date  as day,
                count(case when cae then 1 end) as cae_count,
                count(case when eci then 1 end) as eci_count
         from statut
         group by day
     )
select day            as date,
       cae_count,
       sum(cae_count) over (
           order by day rows between unbounded preceding and current row
           )::integer as cumulated_count,

       eci_count,
       sum(eci_count) over (
           order by day rows between unbounded preceding and current row
           )::integer as cumulated_count

from daily;
