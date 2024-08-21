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
                                       COALESCE(count(*) FILTER (WHERE ir.modified_at <= mb.last_day),
                                                0::bigint)                                                        AS resultats
                                FROM stats.monthly_bucket mb
                                JOIN stats.collectivite c ON true
                                LEFT JOIN (
                                          SELECT iv.id,
                                                 iv.indicateur_id,
                                                 iv.collectivite_id,
                                                 iv.date_valeur,
                                                 iv.metadonnee_id,
                                                 iv.resultat,
                                                 iv.resultat_commentaire,
                                                 iv.objectif,
                                                 iv.objectif_commentaire,
                                                 iv.estimation,
                                                 iv.modified_at,
                                                 iv.created_at,
                                                 iv.modified_by,
                                                 iv.created_by
                                          FROM indicateur_valeur iv
                                          JOIN indicateur_definition id ON iv.indicateur_id = id.id
                                          WHERE id.collectivite_id IS NULL
                                            AND iv.resultat IS NOT NULL
                                          ) ir USING (collectivite_id)
                                GROUP BY mb.first_day, c.collectivite_id, c.departement_code, c.region_code
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
                  WHERE iv.resultat IS NOT NULL
                    AND id.collectivite_id IS NULL
                  )
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
