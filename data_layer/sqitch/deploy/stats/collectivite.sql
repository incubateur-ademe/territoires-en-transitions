-- Deploy tet:stats/collectivite to pg
-- requires: collectivite/collectivite
-- requires: utilisateur/droits

BEGIN;

create view stats_real_collectivites
as
select *
from named_collectivite
where collectivite_id not in (select collectivite_id from collectivite_test);

create view stats_rattachements
as
with daily as (
    select created_at::date as day, count(created_at) as count
    from private_utilisateur_droit d
             join stats_real_collectivites c on d.collectivite_id = c.collectivite_id
    group by day
)
select day                                                                                      as date,
       count,
       sum(count) over (order by day rows between unbounded preceding and current row)::integer as cumulated_count
from daily;

create view stats_unique_active_collectivite
as
with unique_collectivite_droit as (
    select d.collectivite_id, min(created_at) as created_at
    from private_utilisateur_droit d
             join stats_real_collectivites c on d.collectivite_id = c.collectivite_id
    group by d.collectivite_id
),
     daily as (
         select created_at::date as day, count(created_at) as count
         from unique_collectivite_droit d
                  join stats_real_collectivites c on d.collectivite_id = c.collectivite_id
         group by day
     )
select day                                                                                      as date,
       count,
       sum(count) over (order by day rows between unbounded preceding and current row)::integer as cumulated_count
from daily;

COMMIT;
