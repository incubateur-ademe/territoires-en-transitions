-- Revert tet:stats/drop-old-stats-views from pg

BEGIN;

-- Recreate underlying materialized views (so the legacy views can be restored).

DROP MATERIALIZED VIEW IF EXISTS stats.locales_evolution_utilisateur;
CREATE MATERIALIZED VIEW stats.locales_evolution_utilisateur AS
WITH premier_rattachements AS (SELECT u.premier_rattachement::date AS date,
                                      pud.user_id,
                                      pud.collectivite_id,
                                      c.region_code,
                                      c.departement_code
                               FROM stats.utilisateur u
                                      JOIN private_utilisateur_droit pud ON md5(pud.user_id::text) = u.utilisateur
                                      JOIN stats.collectivite c ON c.collectivite_id = pud.collectivite_id
                               WHERE pud.active)
SELECT m.first_day                   AS mois,
       NULL::character varying(2)    AS code_region,
       NULL::character varying(2)    AS code_departement,
       (SELECT count(DISTINCT pr.user_id) AS count
        FROM premier_rattachements pr
        WHERE pr.date >= m.first_day
          AND pr.date <= m.last_day) AS utilisateurs,
       (SELECT count(DISTINCT pr.user_id) AS count
        FROM premier_rattachements pr
        WHERE pr.date <= m.last_day) AS total_utilisateurs
FROM stats.monthly_bucket m
UNION ALL
SELECT m.first_day                                 AS mois,
       r.code                                      AS code_region,
       NULL::character varying                     AS code_departement,
       (SELECT count(DISTINCT pr.user_id) AS count
        FROM premier_rattachements pr
        WHERE pr.date >= m.first_day
          AND pr.date <= m.last_day
          AND pr.region_code::text = r.code::text) AS utilisateurs,
       (SELECT count(DISTINCT pr.user_id) AS count
        FROM premier_rattachements pr
        WHERE pr.date <= m.last_day
          AND pr.region_code::text = r.code::text) AS total_utilisateurs
FROM stats.monthly_bucket m
       JOIN region r ON true
UNION ALL
SELECT m.first_day                                      AS mois,
       NULL::character varying                          AS code_region,
       d.code                                           AS code_departement,
       (SELECT count(DISTINCT pr.user_id) AS count
        FROM premier_rattachements pr
        WHERE pr.date >= m.first_day
          AND pr.date <= m.last_day
          AND pr.departement_code::text = d.code::text) AS utilisateurs,
       (SELECT count(DISTINCT pr.user_id) AS count
        FROM premier_rattachements pr
        WHERE pr.date <= m.last_day
          AND pr.departement_code::text = d.code::text) AS total_utilisateurs
FROM stats.monthly_bucket m
       JOIN departement d ON true
ORDER BY 1;

DROP MATERIALIZED VIEW IF EXISTS stats.carte_epci_par_departement;
CREATE MATERIALIZED VIEW stats.carte_epci_par_departement AS
WITH epcis_departement AS (SELECT c.departement_code                                      AS insee,
                                  count(*)                                                AS total,
                                  count(*)
                                  FILTER (WHERE c.id IN (SELECT collectivite_active.collectivite_id
                                                         FROM stats.collectivite_active)) AS actives
                           FROM collectivite c
                                  JOIN collectivite_banatic_type t on c.nature_insee = t.id
                           WHERE t.type = 'EPCI à fiscalité propre'
                           GROUP BY c.departement_code)
SELECT epcis_departement.insee,
       departement_geojson.libelle,
       epcis_departement.total,
       epcis_departement.actives,
       departement_geojson.geojson
FROM epcis_departement
       JOIN stats.departement_geojson USING (insee);

DROP MATERIALIZED VIEW IF EXISTS stats.locales_evolution_total_activation;
CREATE MATERIALIZED VIEW stats.locales_evolution_total_activation AS
SELECT m.first_day                              AS mois,
       NULL::character varying(2)               AS code_region,
       NULL::character varying(2)               AS code_departement,
       (SELECT count(*) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total,
       (SELECT count(*) FILTER (WHERE cbt.type = 'EPCI à fiscalité propre') AS count
        FROM stats.collectivite_utilisateur cu
               LEFT JOIN collectivite_banatic_type cbt on cu.nature_collectivite = cbt.id
        WHERE cu.date_activation <= m.last_day) AS total_epci,
       (SELECT count(*) FILTER (WHERE cu.type_collectivite = 'syndicat') AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total_syndicat,
       (SELECT count(*) FILTER (WHERE cu.type_collectivite = 'commune') AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total_commune,
       (SELECT count(*) FILTER (WHERE cu.type_collectivite <> 'commune' AND
                                      cu.type_collectivite <> 'syndicat' AND
                                      NOT (cbt.type = 'EPCI à fiscalité propre')) AS count
        FROM stats.collectivite_utilisateur cu
               LEFT JOIN collectivite_banatic_type cbt on cu.nature_collectivite = cbt.id
        WHERE cu.date_activation <= m.last_day) AS total_autre
FROM stats.monthly_bucket m
UNION ALL
SELECT m.first_day                              AS mois,
       r.code                                   AS code_region,
       NULL::character varying(2)               AS code_departement,
       (SELECT count(*) FILTER (WHERE cu.region_code::text = r.code::text) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total,
       (SELECT count(*) FILTER (WHERE cbt.type = 'EPCI à fiscalité propre' AND
                                      cu.region_code::text = r.code::text) AS count
        FROM stats.collectivite_utilisateur cu
               LEFT JOIN collectivite_banatic_type cbt on cu.nature_collectivite = cbt.id
        WHERE cu.date_activation <= m.last_day) AS total_epci,
       (SELECT count(*) FILTER (WHERE cu.type_collectivite = 'syndicat' AND
                                      cu.region_code::text = r.code::text) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total_syndicat,
       (SELECT count(*) FILTER (WHERE cu.type_collectivite = 'commune' AND
                                      cu.region_code::text = r.code::text) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total_commune,
       (SELECT count(*) FILTER (WHERE cu.type_collectivite <> 'commune' AND
                                      cu.type_collectivite <> 'syndicat' AND
                                      NOT (cbt.type = 'EPCI à fiscalité propre') AND
                                      cu.region_code::text = r.code::text) AS count
        FROM stats.collectivite_utilisateur cu
               LEFT JOIN collectivite_banatic_type cbt on cu.nature_collectivite = cbt.id
        WHERE cu.date_activation <= m.last_day) AS total_autre
FROM imports.region r
       JOIN stats.monthly_bucket m ON true
UNION ALL
SELECT m.first_day                              AS mois,
       NULL::character varying(2)               AS code_region,
       d.code                                   AS code_departement,
       (SELECT count(*) FILTER (WHERE cu.departement_code::text = d.code::text) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total,
       (SELECT count(*) FILTER (WHERE cbt.type = 'EPCI à fiscalité propre' AND
                                      cu.departement_code::text = d.code::text) AS count
        FROM stats.collectivite_utilisateur cu
               LEFT JOIN collectivite_banatic_type cbt on cu.nature_collectivite = cbt.id
        WHERE cu.date_activation <= m.last_day) AS total_epci,
       (SELECT count(*) FILTER (WHERE cu.type_collectivite = 'syndicat' AND
                                      cu.departement_code::text = d.code::text) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total_syndicat,
       (SELECT count(*) FILTER (WHERE cu.type_collectivite = 'commune' AND
                                      cu.departement_code::text = d.code::text) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total_commune,
       (SELECT count(*) FILTER (WHERE cu.type_collectivite <> 'commune' AND
                                      cu.type_collectivite <> 'syndicat' AND
                                      NOT (cbt.type = 'EPCI à fiscalité propre') AND
                                      cu.departement_code::text = d.code::text) AS count
        FROM stats.collectivite_utilisateur cu
               LEFT JOIN collectivite_banatic_type cbt on cu.nature_collectivite = cbt.id
        WHERE cu.date_activation <= m.last_day) AS total_autre
FROM imports.departement d
       JOIN stats.monthly_bucket m ON true;

DROP MATERIALIZED VIEW IF EXISTS stats.locales_labellisation_par_niveau;
CREATE MATERIALIZED VIEW stats.locales_labellisation_par_niveau AS
WITH latest_labellisation AS (SELECT l.collectivite_id,
                                     l.referentiel,
                                     (SELECT ll.etoiles
                                      FROM labellisation ll
                                      WHERE ll.collectivite_id = l.collectivite_id
                                        AND ll.referentiel = l.referentiel
                                        AND ll.obtenue_le > (now() - '4 years'::interval)
                                      ORDER BY ll.obtenue_le DESC
                                      LIMIT 1) AS etoiles
                              FROM labellisation l
                              GROUP BY l.collectivite_id, l.referentiel),
     labellisation_locales AS (SELECT l.etoiles,
                                      l.referentiel,
                                      c.region_code,
                                      c.departement_code
                               FROM latest_labellisation l
                                      JOIN stats.collectivite c USING (collectivite_id)
                               WHERE l.etoiles IS NOT NULL
                                 AND l.etoiles > 0)
SELECT NULL::character varying(2) AS code_region,
       NULL::character varying(2) AS code_departement,
       labellisation_locales.referentiel,
       labellisation_locales.etoiles,
       count(*)                   AS labellisations
FROM labellisation_locales
GROUP BY labellisation_locales.referentiel, labellisation_locales.etoiles
UNION ALL
SELECT r.code                          AS code_region,
       NULL::character varying         AS code_departement,
       l.referentiel,
       l.etoiles,
       COALESCE(count(l.*), 0::bigint) AS labellisations
FROM imports.region r
       JOIN labellisation_locales l ON l.region_code::text = r.code::text
GROUP BY l.referentiel, l.etoiles, r.code
UNION ALL
SELECT NULL::character varying         AS code_region,
       d.code                          AS code_departement,
       l.referentiel,
       l.etoiles,
       COALESCE(count(l.*), 0::bigint) AS labellisations
FROM imports.departement d
       JOIN labellisation_locales l ON l.departement_code::text = d.code::text
GROUP BY l.referentiel, l.etoiles, d.code;

DROP MATERIALIZED VIEW IF EXISTS stats.locales_engagement_collectivite;
CREATE MATERIALIZED VIEW stats.locales_engagement_collectivite AS
SELECT c.collectivite_id,
       c.region_code              AS code_region,
       c.departement_code         AS code_departement,
       COALESCE(cot.actif, false) AS cot,
       COALESCE(eci.etoiles, 0)   AS etoiles_eci,
       COALESCE(cae.etoiles, 0)   AS etoiles_cae
FROM stats.collectivite c
       LEFT JOIN cot USING (collectivite_id)
       LEFT JOIN LATERAL ( SELECT l.etoiles
                           FROM labellisation l
                           WHERE l.collectivite_id = c.collectivite_id
                             AND l.referentiel = 'eci'::referentiel
                           ORDER BY l.obtenue_le DESC
                           LIMIT 1) eci ON true
       LEFT JOIN LATERAL ( SELECT l.etoiles
                           FROM labellisation l
                           WHERE l.collectivite_id = c.collectivite_id
                             AND l.referentiel = 'cae'::referentiel
                           ORDER BY l.obtenue_le DESC
                           LIMIT 1) cae ON true;

DROP MATERIALIZED VIEW IF EXISTS stats.locales_evolution_nombre_utilisateur_par_collectivite;
CREATE MATERIALIZED VIEW stats.locales_evolution_nombre_utilisateur_par_collectivite AS
WITH membres AS (SELECT c.*::stats.collectivite AS collectivite,
                        mb.first_day            AS mois,
                        COALESCE(count(*) FILTER (WHERE pud.active AND pud.created_at <= mb.last_day),
                                 0::bigint)     AS nombre
                 FROM stats.monthly_bucket mb
                        JOIN stats.collectivite c ON true
                        LEFT JOIN private_utilisateur_droit pud USING (collectivite_id)
                 WHERE pud.active
                 GROUP BY c.*, mb.first_day)
SELECT membres.mois,
       NULL::character varying(2)                                                  AS code_region,
       NULL::character varying(2)                                                  AS code_departement,
       COALESCE(avg(membres.nombre) FILTER (WHERE membres.nombre > 0), 0::numeric) AS moyen,
       COALESCE(max(membres.nombre) FILTER (WHERE membres.nombre > 0), 0::bigint)  AS maximum,
       COALESCE(percentile_cont(0.5::double precision) WITHIN GROUP (ORDER BY (membres.nombre::double precision))
                FILTER (WHERE membres.nombre > 0), 0::double precision)            AS median
FROM membres
GROUP BY membres.mois
UNION ALL
SELECT membres.mois,
       (membres.collectivite).region_code                                          AS code_region,
       NULL::character varying                                                     AS code_departement,
       COALESCE(avg(membres.nombre) FILTER (WHERE membres.nombre > 0), 0::numeric) AS moyen,
       COALESCE(max(membres.nombre) FILTER (WHERE membres.nombre > 0), 0::bigint)  AS maximum,
       COALESCE(percentile_cont(0.5::double precision) WITHIN GROUP (ORDER BY (membres.nombre::double precision))
                FILTER (WHERE membres.nombre > 0), 0::double precision)            AS median
FROM membres
GROUP BY membres.mois, ((membres.collectivite).region_code)
UNION ALL
SELECT membres.mois,
       NULL::character varying                                                     AS code_region,
       (membres.collectivite).departement_code                                     AS code_departement,
       COALESCE(avg(membres.nombre) FILTER (WHERE membres.nombre > 0), 0::numeric) AS moyen,
       COALESCE(max(membres.nombre) FILTER (WHERE membres.nombre > 0), 0::bigint)  AS maximum,
       COALESCE(percentile_cont(0.5::double precision) WITHIN GROUP (ORDER BY (membres.nombre::double precision))
                FILTER (WHERE membres.nombre > 0), 0::double precision)            AS median
FROM membres
GROUP BY membres.mois, ((membres.collectivite).departement_code);

DROP MATERIALIZED VIEW IF EXISTS stats.locales_evolution_resultat_indicateur_personnalise;
CREATE MATERIALIZED VIEW stats.locales_evolution_resultat_indicateur_personnalise AS
WITH resultats AS (SELECT iv.collectivite_id,
                          sc.region_code,
                          sc.departement_code,
                          iv.modified_at
                   FROM indicateur_valeur iv
                          JOIN indicateur_definition id ON iv.indicateur_id = id.id
                          JOIN stats.collectivite sc ON iv.collectivite_id = sc.collectivite_id
                   WHERE iv.resultat IS NOT NULL
                     AND id.collectivite_id IS NOT NULL)
SELECT m.first_day                AS mois,
       NULL::character varying(2) AS code_region,
       NULL::character varying(2) AS code_departement,
       count(i.*)                 AS indicateurs
FROM stats.monthly_bucket m
       LEFT JOIN resultats i ON i.modified_at <= m.last_day
GROUP BY m.first_day
UNION ALL
SELECT m.first_day             AS mois,
       r.code                  AS code_region,
       NULL::character varying AS code_departement,
       count(i.*)              AS indicateurs
FROM imports.region r
       JOIN stats.monthly_bucket m ON true
       LEFT JOIN resultats i ON i.modified_at <= m.last_day AND i.region_code::text = r.code::text
GROUP BY m.first_day, r.code
UNION ALL
SELECT m.first_day             AS mois,
       NULL::character varying AS code_region,
       d.code                  AS code_departement,
       count(i.*)              AS indicateurs
FROM imports.departement d
       JOIN stats.monthly_bucket m ON true
       LEFT JOIN resultats i ON i.modified_at <= m.last_day AND i.departement_code::text = d.code::text
GROUP BY m.first_day, d.code
ORDER BY 1;

DROP MATERIALIZED VIEW IF EXISTS stats.locales_tranche_completude;
CREATE MATERIALIZED VIEW stats.locales_tranche_completude AS
WITH bounds AS (SELECT unnest('{0,20,50,80,100}'::numeric[]) AS bound),
     ranges AS (SELECT numrange(lower.bound, upper.bound) AS range,
                       lower.bound                        AS lower_bound,
                       upper.bound                        AS upper_bound
                FROM bounds lower
                       LEFT JOIN LATERAL ( SELECT b.bound
                                           FROM bounds b
                                           WHERE b.bound > lower.bound
                                           LIMIT 1) upper ON true)
SELECT r.lower_bound,
       r.upper_bound,
       NULL::character varying(2) AS code_region,
       NULL::character varying(2) AS code_departement,
       in_range.eci,
       in_range.cae
FROM ranges r
       LEFT JOIN LATERAL ( SELECT count(*) FILTER (WHERE r.range @> c.completude_eci::numeric) AS eci,
                                  count(*) FILTER (WHERE r.range @> c.completude_cae::numeric) AS cae
                           FROM stats.locales_pourcentage_completude c) in_range ON true
UNION ALL
SELECT ranges.lower_bound,
       ranges.upper_bound,
       r.code                  AS code_region,
       NULL::character varying AS code_departement,
       in_range.eci,
       in_range.cae
FROM imports.region r
       JOIN ranges ON true
       LEFT JOIN LATERAL ( SELECT count(*) FILTER (WHERE ranges.range @> c.completude_eci::numeric AND
                                                         c.region_code::text = r.code::text) AS eci,
                                  count(*) FILTER (WHERE ranges.range @> c.completude_cae::numeric AND
                                                         c.region_code::text = r.code::text) AS cae
                           FROM stats.locales_pourcentage_completude c) in_range ON true
UNION ALL
SELECT ranges.lower_bound,
       ranges.upper_bound,
       NULL::character varying AS code_region,
       d.code                  AS code_departement,
       in_range.eci,
       in_range.cae
FROM imports.departement d
       JOIN ranges ON true
       LEFT JOIN LATERAL ( SELECT count(*) FILTER (WHERE ranges.range @> c.completude_eci::numeric AND
                                                         c.departement_code::text = d.code::text) AS eci,
                                  count(*) FILTER (WHERE ranges.range @> c.completude_cae::numeric AND
                                                         c.departement_code::text = d.code::text) AS cae
                           FROM stats.locales_pourcentage_completude c) in_range ON true;

DROP MATERIALIZED VIEW IF EXISTS stats.locales_evolution_collectivite_avec_indicateur_referentiel;
CREATE MATERIALIZED VIEW stats.locales_evolution_collectivite_avec_indicateur_referentiel AS
WITH indicateur_collectivite AS (
                                SELECT mb.first_day                                                               AS mois,
                                       c.collectivite_id,
                                       c.region_code,
                                       c.departement_code,
                                       count(ir.*)                                                   AS resultats
                                FROM stats.monthly_bucket mb
                                JOIN stats.collectivite c ON true
                                LEFT JOIN (
                                          SELECT iv.*
                                          FROM indicateur_valeur iv
                                          JOIN indicateur_definition id ON iv.indicateur_id = id.id
                                          where iv.resultat is not null and id.collectivite_id is null
                                          ) ir on ir.collectivite_id = c.collectivite_id and ir.modified_at <= mb.first_day
                                GROUP BY mb.first_day, c.collectivite_id, c.region_code, c.departement_code
                                )
SELECT indicateur_collectivite.mois,
       NULL::character varying(2)                                    AS code_region,
       NULL::character varying(2)                                    AS code_departement,
       count(*) FILTER (WHERE indicateur_collectivite.resultats > 0) AS collectivites
FROM indicateur_collectivite
GROUP BY indicateur_collectivite.mois
UNION ALL
SELECT indicateur_collectivite.mois,
       indicateur_collectivite.region_code                           AS code_region,
       NULL::character varying                                       AS code_departement,
       count(*) FILTER (WHERE indicateur_collectivite.resultats > 0) AS collectivites
FROM indicateur_collectivite
GROUP BY indicateur_collectivite.mois, indicateur_collectivite.region_code
UNION ALL
SELECT indicateur_collectivite.mois,
       NULL::character varying                                       AS code_region,
       indicateur_collectivite.departement_code                      AS code_departement,
       count(*) FILTER (WHERE indicateur_collectivite.resultats > 0) AS collectivites
FROM indicateur_collectivite
GROUP BY indicateur_collectivite.mois, indicateur_collectivite.departement_code
ORDER BY 1;

DROP MATERIALIZED VIEW IF EXISTS stats.locales_evolution_resultat_indicateur_referentiel;
CREATE MATERIALIZED VIEW stats.locales_evolution_resultat_indicateur_referentiel AS
WITH resultats AS (
                  SELECT iv.collectivite_id,
                         sc.region_code,
                         sc.departement_code,
                         iv.modified_at
                  FROM indicateur_valeur iv
                  JOIN indicateur_definition id ON iv.indicateur_id = id.id
                  JOIN stats.collectivite sc ON sc.collectivite_id = iv.collectivite_id
                  where iv.resultat is not null and id.collectivite_id is null
                  ),
     buck_by_cols AS (
                  SELECT m.first_day                AS mois,
                         id.region_code code_region,
                         id.code code_departement
                  from stats.monthly_bucket m
                  join imports.departement id on true
                  ),
     res_by_bucks AS (
                  SELECT
                      m.mois,
                      m.code_region,
                      m.code_departement,
                      count(i.*) AS indicateurs
                  FROM buck_by_cols m
                  LEFT JOIN resultats i ON i.modified_at <= m.mois and m.code_departement = i.departement_code
                  GROUP BY m.mois, m.code_region, m.code_departement
                  )
SELECT m.mois,
       NULL::character varying(2) AS code_region,
       NULL::character varying(2) AS code_departement,
       sum(m.indicateurs)                 AS indicateurs
FROM res_by_bucks m
GROUP BY m.mois
UNION ALL
SELECT m.mois,
       m.code_region,
       NULL::character varying AS code_departement,
       sum(m.indicateurs)              AS indicateurs
FROM res_by_bucks m
GROUP BY m.mois, m.code_region
UNION ALL
SELECT m.mois,
       NULL::character varying AS code_region,
       m.code_departement,
       sum(m.indicateurs)              AS indicateurs
FROM res_by_bucks m
GROUP BY m.mois, m.code_departement
ORDER BY 1;

DROP MATERIALIZED VIEW IF EXISTS stats.evolution_nombre_labellisations;
CREATE MATERIALIZED VIEW stats.evolution_nombre_labellisations AS
WITH l_details AS (
                  SELECT
                      *,
                      LEAD(l.obtenue_le) OVER (
                          PARTITION BY collectivite_id, referentiel ORDER BY obtenue_le
                          ) AS lead_obtenue_le
                  FROM
                      labellisation l
                  ORDER BY
                      collectivite_id, obtenue_le)
select mb.first_day                                                            as mois,
       count(collectivite_id) filter (
           where obtenue_le <= mb.last_day
                     and (lead_obtenue_le > mb.last_day or lead_obtenue_le IS NULL)
                     and obtenue_le>(mb.last_day-interval '4 years')
                     and etoiles = '1') as etoile_1,
       count(collectivite_id) filter (
           where obtenue_le <= mb.last_day
                     and (lead_obtenue_le > mb.last_day or lead_obtenue_le IS NULL)
                     and obtenue_le>(mb.last_day-interval '4 years')
                     and etoiles = '2') as etoile_2,
       count(collectivite_id) filter (
           where obtenue_le <= mb.last_day
                     and (lead_obtenue_le > mb.last_day or lead_obtenue_le IS NULL)
                     and obtenue_le>(mb.last_day-interval '4 years')
                     and etoiles = '3') as etoile_3,
       count(collectivite_id) filter (
           where obtenue_le <= mb.last_day
                     and (lead_obtenue_le > mb.last_day or lead_obtenue_le IS NULL)
                     and obtenue_le>(mb.last_day-interval '4 years')
                     and etoiles = '4') as etoile_4,
       count(collectivite_id) filter (
           where obtenue_le <= mb.last_day
                     and (lead_obtenue_le > mb.last_day or lead_obtenue_le IS NULL)
                     and obtenue_le>(mb.last_day-interval '4 years')
                     and etoiles = '5') as etoile_5
from stats.monthly_bucket mb
join l_details on true
group by mb.first_day
order by mb.first_day;

-- Restore refresh functions to their original behavior.
CREATE OR REPLACE FUNCTION stats.refresh_stats_locales_indicateurs() RETURNS void
  LANGUAGE plpgsql
AS
$$
BEGIN
  refresh materialized view stats.locales_evolution_indicateur_referentiel;
  refresh materialized view stats.locales_evolution_resultat_indicateur_personnalise;
  refresh materialized view stats.locales_evolution_resultat_indicateur_referentiel;
  refresh materialized view stats.locales_evolution_collectivite_avec_indicateur_referentiel;
END
$$;

CREATE OR REPLACE FUNCTION stats.refresh_stats_locales() RETURNS void
  LANGUAGE plpgsql
AS
$$
BEGIN
  refresh materialized view stats.locales_evolution_total_activation;
  refresh materialized view stats.locales_collectivite_actives_et_total_par_type;
  refresh materialized view stats.locales_evolution_utilisateur;
  refresh materialized view stats.locales_evolution_nombre_utilisateur_par_collectivite;
  refresh materialized view stats.locales_pourcentage_completude;
  refresh materialized view stats.locales_tranche_completude;
  refresh materialized view stats.evolution_nombre_fiches;
  refresh materialized view stats.locales_evolution_collectivite_avec_minimum_fiches;
  refresh materialized view stats.locales_engagement_collectivite;
  refresh materialized view stats.locales_labellisation_par_niveau;
  refresh materialized view stats.locales_evolution_nombre_fiches;
END
$$;

CREATE OR REPLACE FUNCTION stats.refresh_views() RETURNS void
AS
$$
BEGIN
  refresh materialized view stats.collectivite;
  refresh materialized view stats.collectivite_utilisateur;
  refresh materialized view stats.collectivite_referentiel;
  refresh materialized view stats.collectivite_labellisation;
  refresh materialized view stats.collectivite_plan_action;
  refresh materialized view stats.collectivite_action_statut;
  refresh materialized view stats.evolution_activation;
  refresh materialized view stats.rattachement;
  refresh materialized view stats.utilisateur;
  refresh materialized view stats.evolution_utilisateur;
  refresh materialized view stats.connection;
  refresh materialized view stats.evolution_connection;
  refresh materialized view stats.carte_collectivite_active;
  refresh materialized view stats.evolution_total_activation_par_type;
  refresh materialized view stats.collectivite_actives_et_total_par_type;
  refresh materialized view stats.evolution_nombre_utilisateur_par_collectivite;
  refresh materialized view stats.carte_epci_par_departement;
  refresh materialized view stats.pourcentage_completude;
  refresh materialized view stats.evolution_collectivite_avec_minimum_fiches;
  refresh materialized view stats.evolution_indicateur_referentiel;
  refresh materialized view stats.evolution_resultat_indicateur_referentiel;
  refresh materialized view stats.evolution_resultat_indicateur_personnalise;
  refresh materialized view stats.engagement_collectivite;
  refresh materialized view stats.evolution_nombre_fiches;
  refresh materialized view stats.evolution_nombre_plans;
  refresh materialized view stats.evolution_nombre_labellisations;
END ;
$$ language plpgsql security definer;

-- Restore legacy "stats" page views.

CREATE OR REPLACE VIEW stats_locales_evolution_utilisateur AS
SELECT *
FROM stats.locales_evolution_utilisateur;

CREATE OR REPLACE VIEW stats_locales_evolution_total_activation AS
SELECT *
FROM stats.locales_evolution_total_activation;

CREATE OR REPLACE VIEW stats_locales_labellisation_par_niveau AS
SELECT *
FROM stats.locales_labellisation_par_niveau;

CREATE OR REPLACE VIEW stats_locales_tranche_completude AS
SELECT *
FROM stats.locales_tranche_completude;

CREATE OR REPLACE VIEW stats_locales_engagement_collectivite AS
SELECT *
FROM stats.locales_engagement_collectivite;

CREATE OR REPLACE VIEW stats_locales_evolution_nombre_utilisateur_par_collectivite AS
SELECT *
FROM stats.locales_evolution_nombre_utilisateur_par_collectivite;

CREATE OR REPLACE VIEW stats_locales_evolution_collectivite_avec_indicateur AS
SELECT mois,
       code_region,
       code_departement,
       collectivites
FROM stats.locales_evolution_collectivite_avec_indicateur_referentiel;

CREATE OR REPLACE VIEW stats_locales_evolution_resultat_indicateur_personnalise AS
SELECT *
FROM stats.locales_evolution_resultat_indicateur_personnalise;

CREATE OR REPLACE VIEW stats_locales_evolution_resultat_indicateur_referentiel AS
SELECT mois,
       code_region,
       code_departement,
       indicateurs
FROM stats.locales_evolution_resultat_indicateur_referentiel;

CREATE OR REPLACE VIEW stats_evolution_nombre_labellisations AS
SELECT *
FROM stats.evolution_nombre_labellisations;

CREATE OR REPLACE VIEW stats_carte_epci_par_departement(insee, libelle, total, actives, geojson) AS
SELECT carte_epci_par_departement.insee,
       carte_epci_par_departement.libelle,
       carte_epci_par_departement.total,
       carte_epci_par_departement.actives,
       carte_epci_par_departement.geojson
FROM stats.carte_epci_par_departement;

COMMIT;

