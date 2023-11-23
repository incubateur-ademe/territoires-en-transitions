-- Deploy tet:stats/vues_BI to pg

BEGIN;

-- evolution_collectivite_avec_minimum_fiches
drop view stats_evolution_collectivite_avec_minimum_fiches;
drop materialized view stats.evolution_collectivite_avec_minimum_fiches;

create materialized view stats.evolution_collectivite_avec_minimum_fiches as
with fiche_collectivite as (select mb.first_day                                         as mois,
                                   ca.collectivite_id,
                                   count(*) filter (where fa.created_at <= mb.last_day) as fiches
                            from stats.monthly_bucket mb
                                     join stats.collectivite_active ca on true
                                     join fiche_action fa using (collectivite_id)
                            group by mb.first_day, ca.collectivite_id)
select fiche_collectivite.mois,
       count(*) filter (where fiche_collectivite.fiches > 5) as collectivites
from fiche_collectivite
group by fiche_collectivite.mois
order by fiche_collectivite.mois;

create view stats_evolution_collectivite_avec_minimum_fiches
as
select *
from stats.evolution_collectivite_avec_minimum_fiches;

-- evolution_nombre_fiches
drop view stats_evolution_nombre_fiches;
drop materialized view stats.evolution_nombre_fiches;

create materialized view stats.evolution_nombre_fiches as
select mb.first_day                                         as mois,
       count(*) filter (where fa.created_at <= mb.last_day) as fiches
from stats.monthly_bucket mb
         join stats.collectivite_active ca on true
         join fiche_action fa using (collectivite_id)
group by mb.first_day
order by mb.first_day;

create view stats_evolution_nombre_fiches
as
select *
from stats.evolution_nombre_fiches;

COMMIT;
