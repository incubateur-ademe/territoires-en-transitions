-- Deploy tet:stats/locale to pg

BEGIN;

create materialized view stats_evolution_total_activation_locales
as
select -- permet de filtrer
       m.first_day                              as mois,
       null:: varchar(2)                           code_region,
       null::varchar(2)                            code_departement,

       -- stats nationales
       (SELECT count(*) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total,
       (SELECT count(*) FILTER (WHERE cu.type_collectivite = 'EPCI'::type_collectivite) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total_epci,
       (SELECT count(*) FILTER (WHERE cu.type_collectivite = 'syndicat'::type_collectivite) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total_syndicat,
       (SELECT count(*) FILTER (WHERE cu.type_collectivite = 'commune'::type_collectivite) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total_commune
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
         join stats.monthly_bucket m on true
;


create function
    stats.refresh_stats_locales()
    returns void
as
$$
begin
    refresh materialized view stats_evolution_total_activation_locales;
end
$$ language plpgsql;
comment on function stats.refresh_stats_locales is
    'Rafraichit les vues matérialisées des stats régionales et départementales.';



COMMIT;
