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

drop view stats_locales_evolution_total_activation;
drop materialized view stats.locales_evolution_total_activation;
create materialized view stats.locales_evolution_total_activation
as
select -- permet de filtrer
       m.first_day                              as mois,
       null:: varchar(2)                        as code_region,
       null::varchar(2)                         as code_departement,

       -- stats nationales
       (select count(*) as count
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day) as total,
       (select count(*) filter (where cu.type_collectivite = 'EPCI'::type_collectivite) as count
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day) as total_epci,
       (select count(*) filter (where cu.type_collectivite = 'syndicat'::type_collectivite) as count
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day) as total_syndicat,
       (select count(*) filter (where cu.type_collectivite = 'commune'::type_collectivite) as count
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day) as total_commune
from stats.monthly_bucket m

union all

select m.first_day as mois,
       r.code,
       null,
       (select count(*) filter ( where cu.region_code = r.code)
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day),
       (select count(*) filter ( where cu.type_collectivite = 'EPCI' and cu.region_code = r.code)
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day),
       (select count(*) filter ( where cu.type_collectivite = 'syndicat' and cu.region_code = r.code)
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day),
       (select count(*) filter ( where cu.type_collectivite = 'commune' and cu.region_code = r.code)
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day)

from imports.region r
         join stats.monthly_bucket m on true

union all

select m.first_day as mois,
       null,
       d.code,
       (select count(*) filter ( where departement_code = d.code)
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day),
       (select count(*) filter ( where cu.type_collectivite = 'EPCI' and departement_code = d.code)
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day),
       (select count(*) filter ( where cu.type_collectivite = 'syndicat' and departement_code = d.code)
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day),
       (select count(*) filter ( where cu.type_collectivite = 'commune' and departement_code = d.code)
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day)

from imports.departement d
         join stats.monthly_bucket m on true;

create view stats_locales_evolution_total_activation as
select *
from stats.locales_evolution_total_activation;

COMMIT;
