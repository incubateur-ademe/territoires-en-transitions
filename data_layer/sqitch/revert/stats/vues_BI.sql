-- Deploy tet:stats/vues_BI to pg

BEGIN;


-- evolution_collectivite_avec_minimum_fiches
drop view stats_evolution_collectivite_avec_minimum_fiches;
drop materialized view stats.evolution_collectivite_avec_minimum_fiches;

create materialized view stats.evolution_collectivite_avec_minimum_fiches as
WITH fiche_collecticite AS (SELECT mb.first_day                                          AS mois,
                                   ca.collectivite_id,
                                   count(*) FILTER (WHERE fa.modified_at <= mb.last_day) AS fiches
                            FROM stats.monthly_bucket mb
                                     JOIN stats.collectivite_active ca ON true
                                     JOIN fiche_action fa USING (collectivite_id)
                            GROUP BY mb.first_day, ca.collectivite_id)
SELECT fiche_collecticite.mois,
       count(*) FILTER (WHERE fiche_collecticite.fiches > 5) AS collectivites
FROM fiche_collecticite
GROUP BY fiche_collecticite.mois
ORDER BY fiche_collecticite.mois;

create view stats_evolution_collectivite_avec_minimum_fiches
as
select *
from stats.evolution_collectivite_avec_minimum_fiches;

-- evolution_nombre_fiches
drop view stats_evolution_nombre_fiches;
drop materialized view stats.evolution_nombre_fiches;

create materialized view stats.evolution_nombre_fiches as
SELECT mb.first_day                                          AS mois,
       count(*) FILTER (WHERE fa.modified_at <= mb.last_day) AS fiches
FROM stats.monthly_bucket mb
         JOIN stats.collectivite_active ca ON true
         JOIN fiche_action fa USING (collectivite_id)
GROUP BY mb.first_day
ORDER BY mb.first_day;

create view stats_evolution_nombre_fiches
as
select *
from stats.evolution_nombre_fiches;

COMMIT;
