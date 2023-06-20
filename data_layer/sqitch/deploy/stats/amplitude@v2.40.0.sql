-- Deploy tet:stats/amplitude to pg

BEGIN;

create function
    stats.amplitude_registered(range tstzrange)
    returns setof stats.amplitude_event
begin
    atomic
    with auditeurs as (select aa.auditeur as user_id
                       from audit_auditeur aa)

    select p.user_id                             as user_id,
           'registered'                          as event_type,
           extract(epoch from p.created_at)::int as time,
           md5('registered' || p.user_id)        as insert_id,
           jsonb_build_object(
                   'telephone',
                   p.telephone is not null and p.telephone != ''
               )                                 as event_properties,

           jsonb_build_object(
                   'fonctions',
                   (select array_agg(distinct m.fonction)
                    from private_collectivite_membre m
                             join private_utilisateur_droit pud
                                  on m.user_id = pud.user_id and m.collectivite_id = pud.collectivite_id
                    where m.user_id = p.user_id
                      and m.fonction is not null
                      and pud.active),
                   'auditeur', (p.user_id in (table auditeurs))
               )                                 as user_properties,

           (select name
            from stats.release_version
            where time < p.created_at
            order by time desc
            limit 1)                             as
                                                    app_version

    from dcp p
    where amplitude_registered.range @> p.created_at;
end;
comment on function stats.amplitude_registered is
    'Les `events` registered Amplitude construits à partir de la création des DCPs.';

create function
    stats.amplitude_events(range tstzrange)
    returns setof stats.amplitude_event
begin
    atomic
    select stats.amplitude_visite(range)
    union all
    select stats.amplitude_registered(range);
end;
comment on function stats.amplitude_events is
    'Tous les évènements Amplitude.';


drop function stats.amplitude_send_yesterday_events;
drop function stats.amplitude_send_visites;
create function
    stats.amplitude_send_events(range tstzrange, batch_size integer default 1000)
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
                    from (select to_jsonb(av.*)                                                         as json_array,
                                 -- en divisant le numéro de la ligne obtenu avec `rank`
                                 -- par la taille du batch, on obtient le nombre `g`
                                 (rank() over (order by time) / amplitude_send_events.batch_size)::int as g
                          from stats.amplitude_events(amplitude_send_events.range) av) numbered
                    group by g)
    select array_agg(events.batch)
    into batches
    from events;

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
begin
    atomic
    select stats.amplitude_send_events(
                   range := tstzrange(current_timestamp::date - interval '1 day', current_timestamp::date)
               );
end;
comment on function stats.amplitude_send_yesterday_events is
    'Envoi les évènements de la veille à Amplitude.';

COMMIT;
