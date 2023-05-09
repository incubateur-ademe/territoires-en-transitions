-- Deploy tet:stats/amplitude to pg

BEGIN;

create table stats.amplitude_configuration
(
    id      serial primary key,
    api_url text not null,
    api_key text not null
);
comment on table stats.amplitude_configuration is
    'La configuration du service Amplitude pour envoyer les `events` par batch. '
        '`https://www.docs.developers.amplitude.com/analytics/apis/batch-event-upload-api/`';

create type stats.amplitude_event as
(
    user_id          text,
    event_type       text,
    time             int,
    insert_id        text,
    event_properties jsonb,
    user_properties  jsonb,
    app_version      text
);
comment on type stats.amplitude_event is
    'Un `event` à envoyer en batch.';

create view stats.release_version
as
select replace(tags[1], '@', '') as name,
       committed_at              as time
from sqitch.events
where array_length(tags, 1) > 0
order by committed_at;
comment on view stats.release_version is
    'Les tags sqitch par date de déploiement.';

create function
    stats.amplitude_visite(range tstzrange)
    returns setof stats.amplitude_event
begin
    atomic
    with auditeurs as (select aa.auditeur as user_id
                       from audit_auditeur aa)

    select v.user_id                                                  as user_id,
           v.page || '_viewed'                                        as event_type,
           extract(epoch from v.time)::int                            as time,
           md5('visite' || v.page || v.user_id::text || v.time::text) as insert_id,
           jsonb_build_object(
                   'page', v.page,
                   'tag', v.tag,
                   'onglet', v.onglet,
                   'collectivite_id', v.collectivite_id,
                   'niveau_acces', pud.niveau_acces,
                   'fonction', pcm.fonction,
                   'champ_intervention', pcm.champ_intervention,
                   'collectivite', to_json(c)
               )                                                      as
                                                                         event_properties,

           jsonb_build_object(
                   'fonctions',
                   (select array_agg(distinct m.fonction)
                    from private_collectivite_membre m
                             join private_utilisateur_droit pud
                                  on m.user_id = pud.user_id and m.collectivite_id = pud.collectivite_id
                    where m.user_id = v.user_id
                      and m.fonction is not null
                      and pud.active),
                   'auditeur', (v.user_id in ( table auditeurs))
               )                                                      as user_properties,

           (select name
            from stats.release_version
            where time < v.time
            order by time desc
            limit 1)                                                  as
                                                                         app_version

    from visite v
             left join private_utilisateur_droit pud
                       on v.user_id = pud.user_id and v.collectivite_id = pud.collectivite_id
             left join private_collectivite_membre pcm
                       on v.collectivite_id = pcm.collectivite_id and v.user_id = pcm.user_id
             left join stats.collectivite c on v.collectivite_id = c.collectivite_id
    where amplitude_visite.range @> v.time;
end;
comment on function stats.amplitude_visite is
    'Les `events` Amplitude construits à partir des visites.';

create table stats.amplitude_log
(
    response    bigint,
    range       tstzrange,
    batch_size  integer,
    batch_index integer
);
comment on table stats.amplitude_log is
    'Permet de diagnostiquer et reconstituer les appels à Amplitude.';

create function
    stats.amplitude_send_visites(range tstzrange, batch_size integer default 1000)
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
                                 (rank() over (order by time) / amplitude_send_visites.batch_size)::int as g
                          from stats.amplitude_visite(amplitude_send_visites.range) av) numbered
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

            -- on attend 1/2 seconde
            perform pg_sleep(.5);
        end loop;
end;
$$ language plpgsql
    -- execute la fonction en tant que postgres
    security definer
    -- permet d'utiliser pg_net depuis un trigger
    set search_path = public, net;
comment on function stats.amplitude_send_visites is
    'Envoie les visites à Amplitude.';

create function
    stats.amplitude_send_yesterday_events()
    returns void
begin
    atomic
    select stats.amplitude_send_visites(
                   range := tstzrange(current_timestamp::date - interval '1 day', current_timestamp::date)
               );
end;
comment on function stats.amplitude_send_yesterday_events is
    'Envoi les évènements de la veille à Amplitude.';

COMMIT;
