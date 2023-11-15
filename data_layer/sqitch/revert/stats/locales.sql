-- Deploy tet:stats/locale to pg

BEGIN;

-- locales_evolution_collectivite_avec_minimum_fiches
drop view stats_locales_evolution_collectivite_avec_minimum_fiches;
drop materialized view stats.locales_evolution_collectivite_avec_minimum_fiches;

create materialized view stats.locales_evolution_collectivite_avec_minimum_fiches as
WITH fiche_collectivite AS (SELECT mb.first_day                                                               AS mois,
                                   c.collectivite_id,
                                   c.region_code,
                                   c.departement_code,
                                   COALESCE(count(*) FILTER (WHERE fa.modified_at <= mb.last_day), 0::bigint) AS fiches
                            FROM stats.monthly_bucket mb
                                     JOIN stats.collectivite c ON true
                                     LEFT JOIN fiche_action fa USING (collectivite_id)
                            GROUP BY mb.first_day, c.collectivite_id, c.departement_code, c.region_code)
SELECT fiche_collectivite.mois,
       NULL::character varying(2)                            AS code_region,
       NULL::character varying(2)                            AS code_departement,
       count(*) FILTER (WHERE fiche_collectivite.fiches > 5) AS collectivites
FROM fiche_collectivite
GROUP BY fiche_collectivite.mois
UNION ALL
SELECT fiche_collectivite.mois,
       fiche_collectivite.region_code                        AS code_region,
       NULL::character varying                               AS code_departement,
       count(*) FILTER (WHERE fiche_collectivite.fiches > 5) AS collectivites
FROM fiche_collectivite
GROUP BY fiche_collectivite.mois, fiche_collectivite.region_code
UNION ALL
SELECT fiche_collectivite.mois,
       NULL::character varying                               AS code_region,
       fiche_collectivite.departement_code                   AS code_departement,
       count(*) FILTER (WHERE fiche_collectivite.fiches > 5) AS collectivites
FROM fiche_collectivite
GROUP BY fiche_collectivite.mois, fiche_collectivite.departement_code
ORDER BY 1;

create view stats_locales_evolution_collectivite_avec_minimum_fiches
as
select *
from stats.locales_evolution_collectivite_avec_minimum_fiches;


-- locales_evolution_nombre_fiches
drop view stats_locales_evolution_nombre_fiches;
drop materialized view stats.locales_evolution_nombre_fiches;

create materialized view stats.locales_evolution_nombre_fiches as
SELECT mb.first_day                                          AS mois,
       NULL::character varying(2)                            AS code_region,
       NULL::character varying(2)                            AS code_departement,
       count(*) FILTER (WHERE fa.modified_at <= mb.last_day) AS fiches
FROM stats.monthly_bucket mb
         JOIN stats.collectivite ca ON true
         JOIN fiche_action fa USING (collectivite_id)
GROUP BY mb.first_day
UNION ALL
SELECT mb.first_day                                          AS mois,
       ca.region_code                                        AS code_region,
       NULL::character varying                               AS code_departement,
       count(*) FILTER (WHERE fa.modified_at <= mb.last_day) AS fiches
FROM stats.monthly_bucket mb
         JOIN stats.collectivite ca ON true
         LEFT JOIN fiche_action fa USING (collectivite_id)
GROUP BY mb.first_day, ca.region_code
UNION ALL
SELECT mb.first_day                                          AS mois,
       NULL::character varying                               AS code_region,
       ca.departement_code                                   AS code_departement,
       count(*) FILTER (WHERE fa.modified_at <= mb.last_day) AS fiches
FROM stats.monthly_bucket mb
         JOIN stats.collectivite ca ON true
         LEFT JOIN fiche_action fa USING (collectivite_id)
GROUP BY mb.first_day, ca.departement_code
ORDER BY 1;

create view stats_locales_evolution_nombre_fiches
as
select *
from stats.locales_evolution_nombre_fiches;

COMMIT;
