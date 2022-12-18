-- Deploy tet:stats/vues_BI to pg

BEGIN;

create or replace function
    stats.refresh_views()
    returns void
as
$$
begin
    refresh materialized view stats.collectivite;
    refresh materialized view stats.collectivite_referentiel;
    refresh materialized view stats.collectivite_labellisation;
    refresh materialized view stats.collectivite_utilisateur;
    refresh materialized view stats.collectivite_plan_action;
    refresh materialized view stats.collectivite_action_statut;
end ;
$$ language plpgsql security definer;
comment on function stats.refresh_views is
    'Rafraichit les vues stats.';

create or replace view stats.monthly_bucket
as
with serie as (select generate_series(0, extract(month from age(now(), date '2022-01-01'))) as m),
     month as
         (select date '2022-01-01' + interval '1 month' * serie.m as start
          from serie)
select month.start::date                                  as first_day,
       (month.start + (interval '1 month - 1 day'))::date as last_day
from month;

drop materialized view stats.evolution_activation;
drop materialized view stats.rattachement;
drop materialized view stats.evolution_utilisateur;
drop materialized view stats.utilisateur;

COMMIT;
