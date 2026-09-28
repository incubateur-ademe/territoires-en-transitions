-- Deploy tet:stats/drop_posthog_schema to pg
-- requires: stats/posthog
-- requires: utilisateur/remove_timescale

BEGIN;

-- Job créé hors sqitch en prod. Il échoue chaque nuit depuis que
-- utilisateur/remove_timescale a supprimé posthog.event(tstzrange) : plus rien
-- n'est envoyé à PostHog depuis la base. Le suivi passe par le SDK (app,
-- backend) et PostHogCollectivitesSyncService (apps/tools).
select cron.unschedule(jobid) from cron.job where jobname = 'posthog_send_yesterday_events';

-- if exists : le contenu du schéma diffère selon les environnements (ex. pas de
-- validate_event en staging et préprod).
drop function if exists posthog.validate_event(jsonb);
drop function if exists posthog.send_events(jsonb);
drop table if exists posthog.configuration;

drop function if exists posthog.event(posthog.latest_score_modification);
drop view if exists posthog.latest_score_modification;
drop function if exists posthog.event(posthog.modification);
drop view if exists posthog.modification;
drop function if exists posthog.event(posthog.creation);
drop view if exists posthog.creation;

drop function if exists posthog.event(visite);
drop function if exists posthog.event(usage);
-- Déjà cassée : lit stats.crm_usages, supprimée par utilisateur/remove_timescale.
drop function if exists posthog.event(collectivite);
drop function if exists posthog.creation_event(dcp);
drop function if exists posthog.event(dcp);
drop function if exists posthog.properties(dcp);

-- Sans cascade : échoue si un objet non versionné subsiste dans le schéma.
drop schema posthog;

COMMIT;
