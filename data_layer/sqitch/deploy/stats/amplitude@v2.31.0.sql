-- Deploy tet:stats/amplitude to pg

BEGIN;

create or replace
    function
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
        end loop;
end;
$$ language plpgsql
    -- execute la fonction en tant que postgres
    security definer
    -- permet d'utiliser pg_net depuis un trigger
    set search_path = public, net;

COMMIT;
