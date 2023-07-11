-- Deploy tet:stats/amplitude to pg

BEGIN;

create type stats.amplitude_content_event as
(
    time    timestamptz,
    user_id uuid
);
comment on type stats.amplitude_content_event is 'Un événement qui concerne un utilisateur sur un contenu.';

create type stats.amplitude_crud_type as enum ('created', 'updated');
comment on type stats.amplitude_crud_type is 'Le type d''événement crud remonté à Amplitude.';

create function
    stats.amplitude_build_crud_events(events stats.amplitude_content_event[], name text, type stats.amplitude_crud_type)
    returns setof stats.amplitude_event
begin
    atomic
    with auditeurs as (select aa.auditeur as user_id
                       from audit_auditeur aa)
    select (ev).user_id                       as user_id,
           name || '_' || type                as event_type,
           extract(epoch from (ev).time)::int as time,
           md5(name || type || (ev).user_id)  as insert_id,
           null::jsonb                        as event_properties,
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
               )                              as user_properties,

           (select v.name
            from stats.release_version v
            where time < (ev).time
            order by time desc
            limit 1)                          as
                                                 app_version

    from (select unnest(events) as ev) as e
    where (ev).user_id is not null
      and (ev).time is not null;
end;
comment on function stats.amplitude_build_crud_events is
    'Construit des `events` crud Amplitude à partir d''événements de contenus.';


drop function stats.amplitude_send_yesterday_events;
drop function stats.amplitude_send_events;
drop function stats.amplitude_events;

create function
    stats.amplitude_send_events(amplitude_events stats.amplitude_event[],
                                range tstzrange,
                                batch_size integer default 1000)
    returns void
as
$$
declare
    batches  jsonb[];
    batch    jsonb;
    response bigint;
    i        integer := 1;
begin
    -- on commence par grouper les événements par lot de `batch_size` dans `batches`
    with events as (select jsonb_agg(json_array) as batch
                    from (select to_jsonb(av.*)                                                        as json_array,
                                 -- en divisant le numéro de la ligne obtenu avec `rank`
                                 -- par la taille du batch, on obtient le nombre `g`
                                 (rank() over (order by time) / amplitude_send_events.batch_size)::int as g
                          from (select * from unnest(amplitude_events)) av) numbered
                    group by g)
    select array_agg(events.batch)
    into batches
    from events;

    if batches is null
    then
        return;
    end if;

    -- puis on itère sur les lots :
    foreach batch in array batches
        loop
        -- on lance une requête asynchrone avec pg_net
        -- et on récupère son id dans `response`
            select net.http_post(
                           url := ac.api_url,
                           body := jsonb_build_object(
                                   'api_key', ac.api_key,
                                   'events', batch
                               )
                       )
            from stats.amplitude_configuration ac
            order by id desc
            limit 1
            into response;

            -- on enregistre l'id et les paramètres pour diagnostiquer par la suite d'éventuelles erreurs.
            insert into stats.amplitude_log (response, range, batch_size, batch_index)
            values (response, range, batch_size, i);

            -- on incrémente le lot
            i := i + 1;
        end loop;
end;
$$ language plpgsql
    -- execute la fonction en tant que postgres
    security definer
    -- permet d'utiliser pg_net depuis un trigger
    set search_path = public, net;

create function
    stats.amplitude_send_yesterday_events()
    returns void
as
$$
declare
    yesterday tstzrange;
begin
    yesterday = tstzrange(current_timestamp::date - interval '1 day', current_timestamp::date);

    perform stats.amplitude_send_events(array_agg(e), yesterday)
    from stats.amplitude_visite(yesterday) e;

    perform stats.amplitude_send_events(array_agg(e), yesterday)
    from stats.amplitude_registered(yesterday) e;
end;
$$ language plpgsql security definer;
comment on function stats.amplitude_send_yesterday_events is
    'Envoi les événements de visite et de creation de compte de la veille à Amplitude.';

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
comment on function stats.amplitude_send_yesterday_creations is
    'Envoi les événements de creation de contenus de la veille à Amplitude.';

COMMIT;
