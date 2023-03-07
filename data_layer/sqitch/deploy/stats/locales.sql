-- Deploy tet:stats/locale to pg

BEGIN;

create materialized view stats.evolution_total_activation_locales
as
select -- permet de filtrer
       m.first_day                              as mois,
       null:: varchar(2)                        as code_region,
       null::varchar(2)                         as code_departement,

       -- stats nationales
       (select count(*) as count
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day) as total,
       (select count(*) filter (where cu.type_collectivite = 'epci'::type_collectivite) as count
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day) as total_epci,
       (select count(*) filter (where cu.type_collectivite = 'syndicat'::type_collectivite) as count
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day) as total_syndicat,
       (select count(*) filter (where cu.type_collectivite = 'commune'::type_collectivite) as count
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day) as total_commune
from stats.monthly_bucket m

union all

select m.first_day as mois,
       r.code,
       null,
       (select count(*) filter ( where cu.region_code = r.code)
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day),
       (select count(*) filter ( where cu.type_collectivite = 'EPCI' and cu.region_code = r.code)
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day),
       (select count(*) filter ( where cu.type_collectivite = 'syndicat' and cu.region_code = r.code)
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day),
       (select count(*) filter ( where cu.type_collectivite = 'commune' and cu.region_code = r.code)
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day)

from imports.region r
         join stats.monthly_bucket m on true

union all

select m.first_day as mois,
       null,
       d.code,
       (select count(*) filter ( where departement_code = d.code)
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day),
       (select count(*) filter ( where cu.type_collectivite = 'EPCI' and departement_code = d.code)
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day),
       (select count(*) filter ( where cu.type_collectivite = 'syndicat' and departement_code = d.code)
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day),
       (select count(*) filter ( where cu.type_collectivite = 'commune' and departement_code = d.code)
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day)

from imports.departement d
         join stats.monthly_bucket m on true;

-- on créé un vue car les vues matérialisées ne sont pas exportées dans les types.
create view stats_evolution_total_activation_locales as select * from stats.evolution_total_activation_locales;


create materialized view stats.collectivite_actives_locales_et_total_par_type
as
with collectivite_typologie as (select c.collectivite_id,
                                       c.region_code,
                                       c.departement_code,
                                       case
                                           when stats.is_fiscalite_propre(c.nature_collectivite) then 'EPCI'
                                           when c.type_collectivite = 'syndicat' then 'syndicat'
                                           when c.type_collectivite = 'commune' then 'commune' end as typologie
                                from stats.collectivite c)

select typologie,
       null:: varchar(2)                        as code_region,
       null::varchar(2)                         as code_departement,
       count(*)                                                                                             as total,
       count(*) filter ( where collectivite_id in (select collectivite_id from stats.collectivite_active) ) as actives
from collectivite_typologie
group by typologie

union all

select typologie,
       region_code,
       null,
       count(*)                                                                                             as total,
       count(*) filter ( where collectivite_id in (select collectivite_id from stats.collectivite_active) ) as actives
from collectivite_typologie
group by typologie, region_code

union all

select typologie,
       null,
       departement_code,
       count(*)                                                                                             as total,
       count(*) filter ( where collectivite_id in (select collectivite_id from stats.collectivite_active) ) as actives
from collectivite_typologie
group by typologie, departement_code;

create view stats_collectivite_actives_locales_et_total_par_type as select * from stats.collectivite_actives_locales_et_total_par_type;



create function
    stats.refresh_stats_locales()
    returns void
as
$$
begin
    refresh materialized view stats.evolution_total_activation_locales;
    refresh materialized view stats.collectivite_actives_locales_et_total_par_type;
end
$$ language plpgsql;
comment on function stats.refresh_stats_locales is
    'Rafraichit les vues matérialisées des stats régionales et départementales.';



COMMIT;
