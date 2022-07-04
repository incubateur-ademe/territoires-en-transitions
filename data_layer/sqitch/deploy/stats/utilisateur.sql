-- Deploy tet:stats/utilisateur to pg
-- requires: utilisateur/droits

BEGIN;

create materialized view stats_unique_active_users
as
with unique_user_droit as (
    select user_id, min(created_at) as created_at
    from private_utilisateur_droit d
             join stats_real_collectivites c on d.collectivite_id = c.collectivite_id
    group by user_id
),
     daily as (
         select created_at::date as day, count(created_at) as count
         from unique_user_droit d
         group by day
     )
select day                                                                                      as date,
       count,
       sum(count) over (order by day rows between unbounded preceding and current row)::integer as cumulated_count
from daily;

COMMIT;
