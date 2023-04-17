-- Revert tet:stats/amplitude from pg

BEGIN;

drop function stats.amplitude_send_yesterday_events;
drop function stats.amplitude_send_visites;
drop function stats.amplitude_visite;
drop table stats.amplitude_log;
drop view stats.release_version;
drop type stats.amplitude_event;
drop type stats.amplitude_event_type;
drop table stats.amplitude_configuration;

COMMIT;
