with daily as (
    select created_at::date as day, count(created_at) as count
    from utilisateurdroits
    where created_at > '2021-06-1' and created_at < '2021-12-1'
    group by day
)
select day,
       count,
       sum(count) over (order by day rows between unbounded preceding and current row)::integer
from daily;
