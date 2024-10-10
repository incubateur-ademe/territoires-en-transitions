-- Deploy tet:stats/locale to pg

BEGIN;

-- Enlève les vues à modifier de la fonction le temps de les modifier
-- pour éviter de supprimer la fonction et le cron lié.
create or replace function refresh_stats_locales() returns void
    language plpgsql
as
$$
begin
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
    refresh materialized view stats.locales_evolution_indicateur_referentiel;
    refresh materialized view stats.locales_evolution_resultat_indicateur_personnalise;
    refresh materialized view stats.locales_evolution_nombre_fiches;
end
$$;

drop view stats_locales_evolution_collectivite_avec_indicateur;
drop materialized view stats.locales_evolution_collectivite_avec_indicateur_referentiel;
drop view postgres.public.stats_locales_evolution_resultat_indicateur_referentiel;
drop materialized view stats.locales_evolution_resultat_indicateur_referentiel;

create materialized view stats.locales_evolution_collectivite_avec_indicateur_referentiel as
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


create materialized view stats.locales_evolution_resultat_indicateur_referentiel as
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
     buck_by_cols as (
                  SELECT m.first_day                AS mois,
                         id.region_code code_region,
                         id.code code_departement
                  from stats.monthly_bucket m
                  join imports.departement id on true
                  ),
     res_by_bucks as (
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

create view stats_locales_evolution_collectivite_avec_indicateur as
SELECT mois,
       code_region,
       code_departement,
       collectivites
FROM stats.locales_evolution_collectivite_avec_indicateur_referentiel;

create view stats_locales_evolution_resultat_indicateur_referentiel as
SELECT mois,
       code_region,
       code_departement,
       indicateurs
FROM stats.locales_evolution_resultat_indicateur_referentiel;

create or replace function refresh_stats_locales() returns void
    language plpgsql
as
$$
begin
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
    refresh materialized view stats.locales_evolution_indicateur_referentiel;
    refresh materialized view stats.locales_evolution_resultat_indicateur_personnalise;
    refresh materialized view stats.locales_evolution_resultat_indicateur_referentiel;
    refresh materialized view stats.locales_evolution_nombre_fiches;
    refresh materialized view stats.locales_evolution_collectivite_avec_indicateur_referentiel;
end
$$;

COMMIT;
