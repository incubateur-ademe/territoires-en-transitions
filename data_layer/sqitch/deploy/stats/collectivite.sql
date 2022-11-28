-- Deploy tet:stats/collectivite to pg
-- requires: collectivite/collectivite
-- requires: utilisateur/droits

BEGIN;

-- on `drop` avec `if exist` car la prod n'est pas synchro avec sandbox,
-- ces fonctionnalités pré-datant l'utilisation de Sqitch.
drop materialized view if exists stats_unique_active_collectivite;
drop view if exists stats_unique_active_collectivite;
drop materialized view if exists stats_real_collectivites;
drop view if exists stats_real_collectivites;
drop materialized view if exists stats_rattachements;
drop view if exists stats_rattachements;

create or replace view stats.collectivite_active
as
select collectivite_id
from collectivite
         join private_utilisateur_droit
              on collectivite.id = private_utilisateur_droit.collectivite_id
where private_utilisateur_droit.active
  and collectivite_id not in (select collectivite_id from collectivite_test)
group by collectivite_id;
comment on view stats.collectivite_active
    is 'Les collectivités actives, soit les collectivités avec au moins un utilisateur rattaché.';

create materialized view stats_unique_active_collectivite
as
with unique_collectivite_droit as (select d.collectivite_id,
                                          min(created_at) as created_at
                                   from private_utilisateur_droit d
                                            join stats.collectivite_active c on d.collectivite_id = c.collectivite_id
                                   group by d.collectivite_id),
     daily as (select created_at::date  as day,
                      count(created_at) as count
               from unique_collectivite_droit d
               group by day)
select day                                                                                      as date,
       count,
       sum(count) over (order by day rows between unbounded preceding and current row)::integer as cumulated_count
from daily;
comment on materialized view stats_unique_active_collectivite
    is 'L''évolution des activations des collectivités, soit l''évolution des rattachements initiaux.';

create materialized view stats_rattachements
as
with daily as (select created_at::date  as day,
                      count(created_at) as count
               from private_utilisateur_droit d
                        join stats.collectivite_active c on d.collectivite_id = c.collectivite_id
               where active
               group by day)
select day                                                                                      as date,
       count,
       sum(count) over (order by day rows between unbounded preceding and current row)::integer as cumulated_count
from daily;
comment on materialized view stats_rattachements
    is 'L''évolution des rattachements des utilisateurs aux collectivités, soit l''évolution de la création des droits.';

refresh materialized view stats_unique_active_collectivite;
refresh materialized view stats_rattachements;

COMMIT;
