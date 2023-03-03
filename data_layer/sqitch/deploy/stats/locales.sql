-- Deploy tet:stats/locale to pg

BEGIN;

create view stats_evolution_total_activation_par_region
as
select m.first_day                              as mois,
       (select count(*)
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day) as total,
       (select count(*) filter ( where cu.type_collectivite = 'EPCI' and region_code = r.code)
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day) as total_epci,
       (select count(*) filter ( where cu.type_collectivite = 'syndicat' and region_code = r.code)
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day) as total_syndicat,
       (select count(*) filter ( where cu.type_collectivite = 'commune' and region_code = r.code)
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day) as total_commune,
       r.code                                   as region_code
from imports.region r
         join stats.monthly_bucket m on true;

COMMIT;
