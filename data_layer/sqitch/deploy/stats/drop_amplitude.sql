-- Deploy tet:stats/drop_amplitude to pg
-- requires: stats/amplitude
-- requires: cron/send_to_amplitude

BEGIN;

-- Amplitude n'est plus utilisé. Filtre sur cron.job plutôt qu'un unschedule
-- par nom, qui échouerait si un job a déjà été retiré à la main.
select cron.unschedule(jobid)
from cron.job
where jobname in ('amplitude_send_yesterday_events', 'amplitude_send_yesterday_creations');

drop function stats.amplitude_send_yesterday_events();
drop function stats.amplitude_send_yesterday_creations();
drop function stats.amplitude_send_events(stats.amplitude_event[], tstzrange, integer);
drop function stats.amplitude_visite(tstzrange);
drop function stats.amplitude_registered(tstzrange);
drop function stats.amplitude_build_crud_events(stats.amplitude_content_event[], text, stats.amplitude_crud_type);
drop function stats.amplitude_build_crud_events(stats.amplitude_content_event[], text, stats.amplitude_crud_type, question_id);

drop table stats.amplitude_log;
drop table stats.amplitude_configuration;

drop type stats.amplitude_event;
drop type stats.amplitude_content_event;
drop type stats.amplitude_crud_type;

COMMIT;
