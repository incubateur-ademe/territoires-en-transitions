-- Deploy tet:stats/drop_vues_stats_inutilisees to pg
-- requires: stats/collectivite
-- requires: stats/utilisateur
-- requires: stats/locales
-- requires: retool/plan_action
-- requires: collectivite/fusion
-- requires: evaluation/drop_client_scores_dependances
-- requires: cron/refresh_stats_collectivite
-- requires: cron/refresh_stats_utilisateur
-- requires: cron/refresh_stats_views_locales
-- requires: cron/refresh_retool_plan_action_premier_usage

BEGIN;

-- Vues matérialisées rafraîchies chaque nuit par pg_cron mais lues par
-- personne : ni l'app, ni le backend, ni apps/tools, et quasiment aucun scan en
-- prod (pg_stat_user_tables). La page stats publique est passée à l'iframe.

-- pg_cron n'existe pas hors Supabase (RDB Scaleway).
do $$
begin
  if to_regclass('cron.job') is not null then
    perform cron.unschedule(jobid)
    from cron.job
    where jobname in (
      'refresh_stats_collectivite',
      'refresh_stats_utilisateur',
      'refresh_stats_views_locales',
      'refresh_stats_views_locales_indicateur',
      'refresh_retool_plan_action_premier_usage'
    );
  end if;
end $$;

drop function stats.refresh_stats_locales();
drop function stats.refresh_stats_locales_indicateurs();

drop view public.stats_evolution_nombre_fiches;
drop view public.stats_locales_collectivite_actives_et_total_par_type;
drop view public.stats_locales_evolution_collectivite_avec_minimum_fiches;
drop view public.stats_locales_evolution_indicateur_referentiel;
drop view public.stats_locales_evolution_nombre_fiches;
drop view public.retool_plan_action_premier_usage;

drop materialized view stats.evolution_nombre_fiches;
drop materialized view stats.locales_collectivite_actives_et_total_par_type;
drop materialized view stats.locales_evolution_collectivite_avec_minimum_fiches;
drop materialized view stats.locales_evolution_indicateur_referentiel;
drop materialized view stats.locales_evolution_nombre_fiches;
drop materialized view private.retool_plan_action_premier_usage;
drop materialized view public.stats_rattachements;
drop materialized view public.stats_unique_active_collectivite;
drop materialized view public.stats_unique_active_users;

COMMIT;
