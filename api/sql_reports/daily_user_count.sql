with real_epci as (
    select uid
    from epci
    where siren != ''
),
     daily as (
         select created_at::date as day, count(created_at) as count
         from utilisateurdroits
            join real_epci on utilisateurdroits.epci_id = real_epci.uid
         where real_epci.uid is not null
         group by day
     )
select day                                                                                      as date,
       count,
       sum(count) over (order by day rows between unbounded preceding and current row)::integer as cumulated_count
from daily;
