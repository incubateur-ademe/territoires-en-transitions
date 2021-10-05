with daily as (
    select created_at::date as day, count(created_at) as count
    from utilisateurdroits
    group by day
)
select day,
       count,
       sum(count) over (order by day rows between unbounded preceding and current row)::integer
from daily;
