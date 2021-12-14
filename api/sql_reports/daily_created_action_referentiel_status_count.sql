with real_epci as (
    select uid
    from epci
    where siren != ''
),
     statut as (
         select action_id like '__prefix__%' as referentiel,
                epci_id,
                created_at
         from actionstatus
                  join real_epci on real_epci.uid = actionstatus.epci_id
         where real_epci.uid is not null
     ),

     daily as (
         select created_at::date                        as day,
                count(case when referentiel then 1 end) as ref_count
         from statut
         group by day
     )
select day            as date,
       ref_count      as count,
       sum(ref_count) over (
           order by day rows between unbounded preceding and current row
           )::integer as cumulated_count

from daily;
