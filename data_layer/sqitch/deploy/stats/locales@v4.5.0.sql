-- Deploy tet:stats/locale to pg

BEGIN;

create or replace function
    stats.refresh_stats_locales()
    returns void
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
    refresh materialized view stats.locales_evolution_indicateur_referentiel;
    refresh materialized view stats.locales_evolution_resultat_indicateur_personnalise;
    refresh materialized view stats.locales_evolution_resultat_indicateur_referentiel;
    refresh materialized view stats.locales_evolution_nombre_fiches;
    refresh materialized view stats.locales_evolution_collectivite_avec_indicateur_referentiel;
end
$$ language plpgsql;

drop view stats_locales_labellisation_par_niveau;
drop materialized view stats.locales_labellisation_par_niveau;

create materialized view stats.locales_labellisation_par_niveau as
WITH latest_labellisation AS (
                             SELECT l.collectivite_id,
                                    l.referentiel,
                                    (
                                    SELECT ll.etoiles
                                    FROM labellisation ll
                                    WHERE ll.collectivite_id = l.collectivite_id
                                      AND ll.referentiel = l.referentiel
                                      AND ll.obtenue_le > (now() - interval '4 years')
                                    ORDER BY ll.obtenue_le DESC
                                    LIMIT 1
                                    ) AS etoiles
                             FROM labellisation l
                             GROUP BY l.collectivite_id, l.referentiel
                             ),
     labellisation_locales AS (
                             SELECT l.etoiles,
                                    l.referentiel,
                                    c.region_code,
                                    c.departement_code
                             FROM latest_labellisation l
                             JOIN stats.collectivite c USING (collectivite_id)
                             WHERE l.etoiles is not null and l.etoiles>0
                             )
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

create view stats_locales_labellisation_par_niveau as
SELECT code_region,
       code_departement,
       referentiel,
       etoiles,
       labellisations
FROM stats.locales_labellisation_par_niveau;

create or replace function
    stats.refresh_stats_locales()
    returns void
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
$$ language plpgsql;


COMMIT;
