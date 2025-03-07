-- Deploy tet:utilisateur/remove_timescale to pg

BEGIN;

drop materialized view if exists stats.evolution_usage_fonction;

drop materialized view if exists stats.evolution_visite;

drop materialized view if exists stats.evolution_utilisateur_unique_quotidien;

drop materialized view if exists stats.evolution_utilisateur_unique_mensuel;

drop view if exists crm_usages;

drop materialized view if exists stats.crm_usages;

drop function if exists stats.amplitude_visite;

drop function if exists posthog.event(tstzrange);

drop function if exists posthog.event(visite);

drop table if exists  visite;

drop function if exists posthog.event(usage);

drop table if exists  usage;

drop extension if exists timescaledb;

COMMIT;
