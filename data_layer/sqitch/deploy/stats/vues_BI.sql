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
