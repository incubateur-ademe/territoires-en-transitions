-- Deploy tet:stats/vues_BI to pg

BEGIN;

create or replace function
    stats.refresh_views()
    returns void
as
$$
begin
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
end ;
$$ language plpgsql security definer;

drop view stats_evolution_nombre_labellisations;
drop materialized view stats.evolution_nombre_labellisations;

create materialized view stats.evolution_nombre_labellisations as
SELECT mb.first_day                                                          AS mois,
       count(*) FILTER (WHERE l.obtenue_le <= mb.last_day AND l.etoiles = 1) AS etoile_1,
       count(*) FILTER (WHERE l.obtenue_le <= mb.last_day AND l.etoiles = 2) AS etoile_2,
       count(*) FILTER (WHERE l.obtenue_le <= mb.last_day AND l.etoiles = 3) AS etoile_3,
       count(*) FILTER (WHERE l.obtenue_le <= mb.last_day AND l.etoiles = 4) AS etoile_4,
       count(*) FILTER (WHERE l.obtenue_le <= mb.last_day AND l.etoiles = 5) AS etoile_5
FROM stats.monthly_bucket mb
JOIN labellisation l ON true
GROUP BY mb.first_day
ORDER BY mb.first_day;

create view stats_evolution_nombre_labellisations as
SELECT mois,
       etoile_1,
       etoile_2,
       etoile_3,
       etoile_4,
       etoile_5
FROM stats.evolution_nombre_labellisations;

create or replace function
    stats.refresh_views()
    returns void
as
$$
begin
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
end ;
$$ language plpgsql security definer;

COMMIT;
