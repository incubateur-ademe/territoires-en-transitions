-- Deploy tet:stats/vues_BI to pg

BEGIN;

drop view if exists stats_evolution_collectivite_avec_minimum_fiches;
drop materialized view if exists stats.evolution_collectivite_avec_minimum_fiches;

create materialized view stats.evolution_collectivite_avec_minimum_fiches
as
with fiche_collecticite as (select first_day                                               as mois,
                                   collectivite_id,
                                   count(*) filter ( where fa.modified_at <= mb.last_day ) as fiches
                            from stats.monthly_bucket mb
                                     join stats.collectivite_active ca on true
                                     join fiche_action fa using (collectivite_id)
                            group by mb.first_day, collectivite_id)
select mois,
       count(*) filter ( where fiches > 5 ) as collectivites
from fiche_collecticite
group by mois
order by mois;

create view stats_evolution_collectivite_avec_minimum_fiches
as
select mois, collectivites
from stats.evolution_collectivite_avec_minimum_fiches;

drop view if exists stats_evolution_nombre_fiches;
drop materialized view if exists stats.evolution_nombre_fiches;

create materialized view stats.evolution_nombre_fiches
as
select first_day                                               as mois,
       count(*) filter ( where fa.modified_at <= mb.last_day ) as fiches
from stats.monthly_bucket mb
         join stats.collectivite_active ca on true
         join fiche_action fa using (collectivite_id)
group by mb.first_day
order by mois;

create view stats_evolution_nombre_fiches
as
select mois, fiches
from stats.evolution_nombre_fiches;

drop materialized view if exists stats.collectivite_plan_action;

-- non réversible car dépendante du plan d'action.
--
-- create materialized view stats.collectivite_plan_action
-- as
-- with fa as (select collectivite_id,
--                    count(*) as count
--             from fiche_action f
--             group by f.collectivite_id),
--      pa as (select collectivite_id,
--                    count(*) as count
--             from plan_action p
--             group by p.collectivite_id)
-- select c.*,
--        coalesce(fa.count, 0) as fiches,
--        coalesce(pa.count, 0) as plans
-- from stats.collectivite c
--          left join pa on pa.collectivite_id = c.collectivite_id
--          left join fa on pa.collectivite_id = fa.collectivite_id
-- order by fiches desc;

COMMIT;
