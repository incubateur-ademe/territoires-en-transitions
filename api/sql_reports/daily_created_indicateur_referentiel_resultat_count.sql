with daily as (
  select created_at::date as day,
    count(created_at) as count
  from indicateurresultat
  where epci_id != 'test'
    and indicateur_id like '%indicateur_id_regex'
  group by day
)
select day as date,
  count,
  sum(count) over (
    order by day rows between unbounded preceding and current row
  )::integer as cumulated_count
from daily