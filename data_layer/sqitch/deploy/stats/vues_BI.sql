-- Deploy tet:stats/vues_BI to pg

BEGIN;

create or replace view stats.monthly_bucket
as
with serie as (select generate_series(0, (extract(month from age(now(), date '2021-01-01')) +
                                          extract(year from age(now(), date '2021-01-01')) * 12)) as m),
     month as
         (select date '2021-01-01' + interval '1 month' * serie.m as start
          from serie)
select month.start::date                                  as first_day,
       (month.start + (interval '1 month - 1 day'))::date as last_day
from month;

create materialized view stats.connection
as
with utilisateur as (select distinct pud.user_id
                     from private_utilisateur_droit pud
                              join stats.collectivite c on pud.collectivite_id = c.collectivite_id
                     where pud.collectivite_id not in (select collectivite_id from collectivite_test)
                       and pud.active),
     event as (select payload ->> 'actor_id' as user_id,
                      created_at::date
               from utilisateur u
                        join auth.audit_log_entries
                             on (payload ->> 'actor_id')::uuid = u.user_id
               where payload ->> 'action' = 'login'
                  or payload ->> 'action' = 'token_refreshed'
               order by created_at desc)
select md5(user_id) as utilisateur,
       created_at
from event
group by created_at, user_id
order by created_at desc;
comment on materialized view stats.connection
    is 'Les connection utilisateurs reconstituée à partir des événements '
        '`login` et `token_refreshed` avec maximum d''un événement par utilisateur par jour.';

create materialized view stats.evolution_connection
as
select m.first_day                        as mois,
       (select count(*)
        from stats.connection c
        where c.created_at >= m.first_day
          and c.created_at <= m.last_day) as connections,
       (select count(distinct c.utilisateur)
        from stats.connection c
        where c.created_at >= m.first_day
          and c.created_at <= m.last_day) as utilisateurs_uniques,
       (select count(*)
        from stats.connection c
        where c.created_at <= m.last_day) as total_connections,
       (select count(distinct c.utilisateur)
        from stats.connection c
        where c.created_at <= m.last_day) as total_utilisateurs_uniques
from stats.monthly_bucket m;

create or replace function
    stats.refresh_views()
    returns void
as
$$
begin
    refresh materialized view stats.collectivite;
    refresh materialized view stats.collectivite_utilisateur;
    refresh materialized view stats.collectivite_referentiel;
    refresh materialized view stats.collectivite_labellisation;
    refresh materialized view stats.collectivite_plan_action;
    refresh materialized view stats.collectivite_action_statut;
    refresh materialized view stats.evolution_activation;
    refresh materialized view stats.rattachement;
    refresh materialized view stats.utilisateur;
    refresh materialized view stats.evolution_utilisateur;
    refresh materialized view stats.connection;
    refresh materialized view stats.evolution_connection;
end ;
$$ language plpgsql security definer;


COMMIT;
