-- Deploy tet:referentiel/verification_score to pg

BEGIN;

create schema if not exists config;
create table if not exists config.service_configurations
(
    service_key text primary key,
    service_url text   not null,
    token      text,
    created_at timestamp with time zone default CURRENT_TIMESTAMP not null
);

create or replace function automatisation.verification_scores(
    out status integer
)
as
$$
with configuration as (select 
                        CONCAT(service_url,'/api/v1/referentiels/all/check-last-scores?notification=true') as verification_url,
                        jsonb_build_object(
                            'Authorization', CONCAT('Bearer ', token)
                        ) as verification_headers
                       from config.service_configurations
                       where service_key = 'backend'
                       order by created_at desc
                       limit 1)
select post.*
from configuration -- si il n'y a aucune configuration on ne fait pas d'appel
         left join lateral (select *
                            from net.http_get(
                                    configuration.verification_url,
                                    '{}'::jsonb,
                                    configuration.verification_headers
                                )
    ) as post on true
$$
    language sql
    security definer
    -- permet au trigger d'utiliser l'extension http.
    set search_path = public, extensions;
comment on function automatisation.verification_scores
    is 'Appel la fonction de verification des scores pour tester le nouveau moteur de calcul';

select cron.schedule('verification_scores',
                     '0 3 * * *', -- every day
                     $$select automatisation.verification_scores();$$);

COMMIT;
