-- Deploy tet:stats/locale to pg

BEGIN;

drop function stats.refresh_stats_locales_indicateurs();

create or replace function stats.refresh_stats_locales() returns void
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
