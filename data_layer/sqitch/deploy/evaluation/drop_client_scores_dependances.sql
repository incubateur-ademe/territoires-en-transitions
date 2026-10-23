-- Deploy tet:evaluation/drop_client_scores_dependances to pg

BEGIN;

-- client_scores, pre_audit_scores et post_audit_scores ne sont plus écrites
-- (remplacées par score_snapshot) : on retire tout ce qui les lit encore.

-- 1. CRM : la synchro Airtable de crm_usages est désactivée en production.
drop view public.crm_usages;
drop materialized view stats.crm_usages;

-- 2. Fonctions de refresh appelées par pg_cron.
CREATE OR REPLACE FUNCTION stats.refresh_stats_locales() RETURNS void
  LANGUAGE plpgsql
AS
$$
BEGIN
  refresh materialized view stats.locales_collectivite_actives_et_total_par_type;
  refresh materialized view stats.evolution_nombre_fiches;
  refresh materialized view stats.locales_evolution_collectivite_avec_minimum_fiches;
  refresh materialized view stats.locales_evolution_nombre_fiches;
END
$$;

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

create or replace function stats.refresh_views_crm() returns void
    security definer
    language plpgsql
as
$$
begin
    refresh materialized view stats.crm_indicateurs;
    refresh materialized view stats.crm_plans;
end ;
$$;

-- pg_cron n'existe pas hors Supabase (RDB Scaleway).
do $$
begin
  if to_regclass('cron.job') is not null then
    perform cron.unschedule(jobid) from cron.job where jobname = 'refresh_stats_completude';
  end if;
end $$;

-- 3. Vues et fonctions qui lisent les anciennes tables de scores.
drop materialized view public.stats_tranche_completude;
drop materialized view stats.pourcentage_completude;
drop materialized view stats.locales_pourcentage_completude;
drop view public.retool_completude;
drop function labellisation.critere_action(integer);
drop function public.delete_collectivite_test(integer);

COMMIT;
