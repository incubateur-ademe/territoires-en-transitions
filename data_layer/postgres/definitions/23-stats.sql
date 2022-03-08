create view stats_rattachements
as
with daily as (
    select created_at::date as day, count(created_at) as count
    from private_utilisateur_droit d
             join named_collectivite c on d.collectivite_id = c.collectivite_id
    group by day
)
select day                                                                                      as date,
       count,
       sum(count) over (order by day rows between unbounded preceding and current row)::integer as cumulated_count
from daily;
