-- Deploy tet:stats/locale to pg

BEGIN;

drop function stats.refresh_stats_locales();
drop view stats_locales_evolution_utilisateur;
drop materialized view stats.locales_evolution_utilisateur;

create materialized view stats.locales_evolution_utilisateur
as
with premier_rattachements as (
    -- retrouve les collectivités des premiers rattachements des utilisateurs actifs.
    select u.premier_rattachement::date as date,
           pud.user_id,
           pud.collectivite_id,
           c.region_code,
           c.departement_code
    from stats.utilisateur u
             join private_utilisateur_droit pud
                  on md5(pud.user_id::text) = u.utilisateur
             join stats.collectivite c on c.collectivite_id = pud.collectivite_id
    where active)
select m.first_day                   as mois,
       null:: varchar(2)             as code_region,
       null::varchar(2)              as code_departement,
       (select count(distinct user_id)
        from premier_rattachements pr
        where pr.date >= m.first_day
          and pr.date <= m.last_day) as utilisateurs,
       (select count(distinct user_id)
        from premier_rattachements pr
        where pr.date <= m.last_day) as total_utilisateurs
from stats.monthly_bucket m

union all

select m.first_day,
       r.code,
       null,
       (select count(distinct user_id)
        from premier_rattachements pr
        where pr.date >= m.first_day
          and pr.date <= m.last_day
          and pr.region_code = r.code),
       (select count(distinct user_id)
        from premier_rattachements pr
        where pr.date <= m.last_day
          and pr.region_code = r.code)
from stats.monthly_bucket m
         join region r on true

union all

select m.first_day,
       null,
       d.code,
       (select count(distinct user_id)
        from premier_rattachements pr
        where pr.date >= m.first_day
          and pr.date <= m.last_day
          and pr.region_code = d.code),
       (select count(distinct user_id)
        from premier_rattachements pr
        where pr.date <= m.last_day
          and pr.region_code = d.code)
from stats.monthly_bucket m
         join departement d on true

order by mois;


create view stats_locales_evolution_utilisateur as
select *
from stats.locales_evolution_utilisateur;


create function
    stats.refresh_stats_locales()
    returns void
as
$$
begin
    refresh materialized view stats.locales_evolution_total_activation;
    refresh materialized view stats.locales_collectivite_actives_et_total_par_type;
    refresh materialized view stats.locales_evolution_utilisateur;
    refresh materialized view stats.locales_evolution_nombre_utilisateur_par_collectivite;
    refresh materialized view stats.locales_pourcentage_completude;
    refresh materialized view stats.locales_tranche_completude;
    refresh materialized view stats.evolution_nombre_fiches;
    refresh materialized view stats.locales_evolution_collectivite_avec_minimum_fiches;
    refresh materialized view stats.locales_engagement_collectivite;
    refresh materialized view stats.locales_labellisation_par_niveau;
    refresh materialized view stats.locales_evolution_indicateur_referentiel;
    refresh materialized view stats.locales_evolution_resultat_indicateur_personnalise;
    refresh materialized view stats.locales_evolution_resultat_indicateur_referentiel;
    refresh materialized view stats.locales_evolution_nombre_fiches;
    refresh materialized view stats.locales_evolution_collectivite_avec_indicateur_referentiel;
end
$$ language plpgsql;

COMMIT;
