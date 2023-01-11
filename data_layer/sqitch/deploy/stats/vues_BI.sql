-- Deploy tet:stats/vues_BI to pg

BEGIN;

create materialized view stats.evolution_nombre_fiches
as
select first_day                                               as mois,
       count(*) filter ( where fa.modified_at <= mb.last_day ) as fiches
from stats.monthly_bucket mb
         join stats.collectivite_active ca on true
         join fiche_action fa using (collectivite_id)
group by mb.first_day
order by mois;

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
