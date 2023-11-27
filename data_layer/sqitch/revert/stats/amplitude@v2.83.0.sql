-- Deploy tet:stats/amplitude to pg

BEGIN;

drop function stats.amplitude_build_crud_events(
    stats.amplitude_content_event[],
    text,
    stats.amplitude_crud_type,
    question_id
);

create or replace function
    stats.amplitude_send_yesterday_creations()
    returns void
as
$$
declare
    yesterday tstzrange;
begin
    yesterday = tstzrange(current_timestamp::date - interval '1 day', current_timestamp::date);

    perform (with -- transforme les fiches de la veille en content events.
                  ce as (select (created_at, modified_by)::stats.amplitude_content_event as events
                         from fiche_action
                         where yesterday @> created_at
                           and modified_by is not null),
                  -- transforme les content events en crud events,
                  crud as (select stats.amplitude_build_crud_events(array_agg(ce.events), 'fiche', 'created') as events
                           from ce)
                  -- envoie les crud event et spécifie le range pour le log.
             select stats.amplitude_send_events(array_agg(crud.events), yesterday)
             from crud);

    perform (with -- transforme les plans de la veille en content events.
                  ce as (select (created_at, modified_by)::stats.amplitude_content_event as events
                         from axe
                         where yesterday @> created_at
                           and modified_by is not null
                           and parent is null),
                  -- transforme les content events en crud events,
                  crud as (select stats.amplitude_build_crud_events(array_agg(ce.events), 'plan', 'created') as events
                           from ce)
                  -- envoie les crud event et spécifie le range pour le log.
             select stats.amplitude_send_events(array_agg(crud.events), yesterday)
             from crud);
end;
$$ language plpgsql;

COMMIT;
