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
end ;
$$ language plpgsql security definer;

drop view public.stats_carte_collectivite_active;
drop materialized view stats.carte_collectivite_active;
drop view stats_evolution_total_activation_par_type;
drop materialized view stats.evolution_total_activation_par_type;
drop view stats_collectivite_actives_et_total_par_type;
drop materialized view stats.collectivite_actives_et_total_par_type;
drop view stats_evolution_utilisateur;
drop view stats_evolution_nombre_utilisateur_par_collectivite;
drop materialized view stats.evolution_nombre_utilisateur_par_collectivite;
drop view stats_carte_epci_par_departement;
drop materialized view stats.carte_epci_par_departement;
drop materialized view stats.pourcentage_completude;
drop view stats_evolution_collectivite_avec_minimum_fiches;
drop materialized view stats.evolution_collectivite_avec_minimum_fiches;

COMMIT;
