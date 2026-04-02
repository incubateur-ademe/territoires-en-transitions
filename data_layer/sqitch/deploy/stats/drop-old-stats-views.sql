-- Deploy tet:stats/drop-old-stats-views to pg

BEGIN;

-- Legacy "stats" page views (replaced by the iframe/dashboard).
DROP VIEW IF EXISTS public.stats_locales_evolution_utilisateur;
DROP VIEW IF EXISTS public.stats_carte_epci_par_departement;
DROP VIEW IF EXISTS public.stats_locales_evolution_total_activation;
DROP VIEW IF EXISTS public.stats_locales_labellisation_par_niveau;
DROP VIEW IF EXISTS public.stats_evolution_nombre_labellisations;
DROP VIEW IF EXISTS public.stats_locales_evolution_collectivite_avec_indicateur;
DROP VIEW IF EXISTS public.stats_locales_engagement_collectivite;
DROP VIEW IF EXISTS public.stats_locales_evolution_nombre_utilisateur_par_collectivite;
DROP VIEW IF EXISTS public.stats_locales_tranche_completude;
DROP VIEW IF EXISTS public.stats_locales_evolution_resultat_indicateur_personnalise;
DROP VIEW IF EXISTS public.stats_locales_evolution_resultat_indicateur_referentiel;

-- Update refresh functions so the daily cron jobs don't crash.

-- 1) Refresh stats/locales (used by cron `refresh_stats_views_locales*`)
CREATE OR REPLACE FUNCTION stats.refresh_stats_locales_indicateurs() RETURNS void
  LANGUAGE plpgsql
AS
$$
BEGIN
  refresh materialized view stats.locales_evolution_indicateur_referentiel;
END
$$;

CREATE OR REPLACE FUNCTION stats.refresh_stats_locales() RETURNS void
  LANGUAGE plpgsql
AS
$$
BEGIN
  refresh materialized view stats.locales_collectivite_actives_et_total_par_type;
  refresh materialized view stats.locales_pourcentage_completude;
  refresh materialized view stats.evolution_nombre_fiches;
  refresh materialized view stats.locales_evolution_collectivite_avec_minimum_fiches;
  refresh materialized view stats.locales_evolution_nombre_fiches;
END
$$;

-- 2) Refresh BI stats (used by cron `refresh_stats_views`)
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

  -- Removed: stats.carte_epci_par_departement

  refresh materialized view stats.pourcentage_completude;
  refresh materialized view stats.evolution_collectivite_avec_minimum_fiches;
  refresh materialized view stats.evolution_indicateur_referentiel;
  refresh materialized view stats.evolution_resultat_indicateur_referentiel;
  refresh materialized view stats.evolution_resultat_indicateur_personnalise;
  refresh materialized view stats.engagement_collectivite;
  refresh materialized view stats.evolution_nombre_fiches;
  refresh materialized view stats.evolution_nombre_plans;

  -- Removed: stats.evolution_nombre_labellisations
END ;
$$ language plpgsql security definer;

-- Drop underlying materialized views in `stats` schema.
DROP MATERIALIZED VIEW IF EXISTS stats.locales_evolution_utilisateur;
DROP MATERIALIZED VIEW IF EXISTS stats.carte_epci_par_departement;
DROP MATERIALIZED VIEW IF EXISTS stats.locales_evolution_total_activation;
DROP MATERIALIZED VIEW IF EXISTS stats.locales_labellisation_par_niveau;
DROP MATERIALIZED VIEW IF EXISTS stats.evolution_nombre_labellisations;
DROP MATERIALIZED VIEW IF EXISTS stats.locales_evolution_collectivite_avec_indicateur_referentiel;
DROP MATERIALIZED VIEW IF EXISTS stats.locales_engagement_collectivite;
DROP MATERIALIZED VIEW IF EXISTS stats.locales_evolution_nombre_utilisateur_par_collectivite;
DROP MATERIALIZED VIEW IF EXISTS stats.locales_tranche_completude;
DROP MATERIALIZED VIEW IF EXISTS stats.locales_evolution_resultat_indicateur_personnalise;
DROP MATERIALIZED VIEW IF EXISTS stats.locales_evolution_resultat_indicateur_referentiel;

COMMIT;

