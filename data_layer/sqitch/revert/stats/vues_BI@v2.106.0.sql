-- Deploy tet:stats/vues_BI to pg

BEGIN;

drop view stats_evolution_nombre_labellisations;
drop materialized view stats.evolution_nombre_labellisations;

drop view stats_evolution_nombre_plans;
drop materialized view stats.evolution_nombre_plans;

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
end ;
$$ language plpgsql security definer;

COMMIT;
