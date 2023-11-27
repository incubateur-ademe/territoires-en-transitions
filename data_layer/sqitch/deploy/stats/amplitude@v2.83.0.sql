-- Deploy tet:stats/amplitude to pg

BEGIN;

create function
    stats.amplitude_build_crud_events(
    events stats.amplitude_content_event[],
    name text,
    type stats.amplitude_crud_type,
    question_id question_id
)
    returns setof stats.amplitude_event
begin
    atomic
    with auditeurs as (select aa.auditeur as user_id
                       from audit_auditeur aa)
    select (ev).user_id                                   as user_id,
           name || '_' || type                            as event_type,
           extract(epoch from (ev).time)::int             as time,
           md5(name || type || (ev).user_id)              as insert_id,
           jsonb_build_object('question_id', question_id) as event_properties,
           jsonb_build_object(
                   'fonctions',
                   (select array_agg(distinct m.fonction)
                    from private_collectivite_membre m
                             join private_utilisateur_droit pud
                                  on m.user_id = pud.user_id and m.collectivite_id = pud.collectivite_id
                    where m.user_id = (ev).user_id
                      and m.fonction is not null
                      and pud.active),
                   'auditeur', ((ev).user_id in (table auditeurs))
               )                                          as user_properties,

           (select v.name
            from stats.release_version v
            where time < (ev).time
            order by time desc
            limit 1)                                      as app_version

    from (select unnest(events) as ev) as e
    where (ev).user_id is not null
      and (ev).time is not null;
end;
comment on function stats.amplitude_build_crud_events(
    stats.amplitude_content_event[],
    text,
    stats.amplitude_crud_type,
    question_id
    ) is 'Construit des `events` crud Amplitude à partir d''événements de contenus liés à des questions.';

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

    perform (with -- transforme les réponses de la veille en content events.
                  ce as (select (modified_at, modified_by)::stats.amplitude_content_event as event,
                                r.question_id
                         from historique.reponse_binaire r
                         where yesterday @> modified_at
                           and modified_by is not null
                         union all
                         select (modified_at, modified_by)::stats.amplitude_content_event as event,
                                r.question_id
                         from historique.reponse_choix r
                         where yesterday @> modified_at
                           and modified_by is not null
                         union all
                         select (modified_at, modified_by)::stats.amplitude_content_event as event,
                                r.question_id
                         from historique.reponse_proportion r
                         where yesterday @> modified_at
                           and modified_by is not null),
                  -- transforme les content events en crud events,
                  crud as (select stats.amplitude_build_crud_events(
                                          array_agg(ce.event),
                                          'reponse',
                                          'created',
                                          question_id := ce.question_id) as events
                           from ce
                           group by ce.question_id)
                  -- envoie les crud event et spécifie le range pour le log.
             select stats.amplitude_send_events(array_agg(crud.events), yesterday)
             from crud);

    perform (with -- transforme les justifications de la veille en content events.
                  ce as (select (modified_at, modified_by)::stats.amplitude_content_event as event,
                                j.question_id
                         from historique.justification j
                         where yesterday @> modified_at
                           and modified_by is not null),
                  -- transforme les content events en crud events,
                  crud as (select stats.amplitude_build_crud_events(
                                          array_agg(ce.event),
                                          'justification',
                                          'created',
                                          question_id := ce.question_id) as events
                           from ce
                           group by ce.question_id)
                  -- envoie les crud event et spécifie le range pour le log.
             select stats.amplitude_send_events(array_agg(crud.events), yesterday)
             from crud);
end;
$$ language plpgsql;

COMMIT;
