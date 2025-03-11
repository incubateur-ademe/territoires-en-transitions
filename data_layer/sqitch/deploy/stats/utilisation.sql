-- Deploy tet:stats/utilisation to pg

BEGIN;

create materialized view stats.evolution_usage_fonction
as
select date_trunc('day', time, 'Europe/Paris') as jour,
       fonction,
       action,
       page,
       count(*)                   as occurences
from usage
group by jour, fonction, action, page
order by jour;

create materialized view stats.evolution_visite
as
select date_trunc('day', time, 'Europe/Paris') as jour,
       page,
       tag,
       onglet,
       count(*)                   as occurences
from visite
group by jour, page, tag, onglet
order by jour;

create materialized view stats.evolution_utilisateur_unique_quotidien
as
with daily_users as (select date_trunc('day', time, 'Europe/Paris') as jour,
                            user_id
                     from visite
                     group by jour, user_id
                     order by jour)
select jour,
       count(*) as utilisateurs
from daily_users
group by jour;

create materialized view stats.evolution_utilisateur_unique_mensuel
as
with daily_users as (select date_trunc('month', time, 'Europe/Paris') as mois,
                            user_id
                     from visite
                     group by mois, user_id
                     order by mois)
select mois,
       count(*) as utilisateurs
from daily_users
group by mois;

create function
    stats.refresh_views_utilisation()
    returns void
as
$$
begin
    refresh materialized view stats.evolution_usage_fonction;
    refresh materialized view stats.evolution_visite;
    refresh materialized view stats.evolution_utilisateur_unique_quotidien;
    refresh materialized view stats.evolution_utilisateur_unique_mensuel;
end;
$$ language plpgsql;

COMMIT;
