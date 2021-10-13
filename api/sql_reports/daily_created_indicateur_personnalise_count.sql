with daily as (
    select created_at::date as day, count(created_at) as count
    from indicateurpersonnalise
    where epci_id != 'test'
    group by day

)
select day as date,
       count,
       sum(count) over (order by day rows between unbounded preceding and current row)::integer as cumulated_count
from daily