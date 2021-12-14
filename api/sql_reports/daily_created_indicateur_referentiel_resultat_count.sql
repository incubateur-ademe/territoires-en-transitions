with real_epci as (
    select uid
    from epci
    where siren != ''
),  daily as (
  select created_at::date as day,
    count(created_at) as count
  from indicateurresultat
    join real_epci on real_epci.uid = indicateurresultat.epci_id
  where real_epci.uid is not null
    and indicateur_id like '%indicateur_id_regex'
  group by day
)
select day as date,
  count,
  sum(count) over (
    order by day rows between unbounded preceding and current row
  )::integer as cumulated_count
from daily
