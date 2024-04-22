-- Deploy tet:stats/locale to pg

BEGIN;

-- locales_evolution_collectivite_avec_minimum_fiches
drop view stats_locales_evolution_collectivite_avec_minimum_fiches;
drop materialized view stats.locales_evolution_collectivite_avec_minimum_fiches;

create materialized view stats.locales_evolution_collectivite_avec_minimum_fiches as
with fiche_collectivite as (select mb.first_day                                                              as mois,
                                   c.collectivite_id,
                                   c.region_code,
                                   c.departement_code,
                                   coalesce(count(*) filter (where fa.created_at <= mb.last_day), 0::bigint) as fiches
                            from stats.monthly_bucket mb
                                     join stats.collectivite c on true
                                     left join fiche_action fa using (collectivite_id)
                            group by mb.first_day, c.collectivite_id, c.departement_code, c.region_code)
select fiche_collectivite.mois,
       null::character varying(2)                            as code_region,
       null::character varying(2)                            as code_departement,
       count(*) filter (where fiche_collectivite.fiches > 5) as collectivites
from fiche_collectivite
group by fiche_collectivite.mois
union all
select fiche_collectivite.mois,
       fiche_collectivite.region_code                        as code_region,
       null::character varying                               as code_departement,
       count(*) filter (where fiche_collectivite.fiches > 5) as collectivites
from fiche_collectivite
group by fiche_collectivite.mois, fiche_collectivite.region_code
union all
select fiche_collectivite.mois,
       null::character varying                               as code_region,
       fiche_collectivite.departement_code                   as code_departement,
       count(*) filter (where fiche_collectivite.fiches > 5) as collectivites
from fiche_collectivite
group by fiche_collectivite.mois, fiche_collectivite.departement_code
order by 1;

create view stats_locales_evolution_collectivite_avec_minimum_fiches
as
select *
from stats.locales_evolution_collectivite_avec_minimum_fiches;


-- locales_evolution_nombre_fiches
drop view stats_locales_evolution_nombre_fiches;
drop materialized view stats.locales_evolution_nombre_fiches;

create materialized view stats.locales_evolution_nombre_fiches as
select mb.first_day                                         as mois,
       null::character varying(2)                           as code_region,
       null::character varying(2)                           as code_departement,
       count(*) filter (where fa.created_at <= mb.last_day) as fiches
from stats.monthly_bucket mb
         join stats.collectivite ca on true
         join fiche_action fa using (collectivite_id)
group by mb.first_day
union all
select mb.first_day                                         as mois,
       ca.region_code                                       as code_region,
       null::character varying                              as code_departement,
       count(*) filter (where fa.created_at <= mb.last_day) as fiches
from stats.monthly_bucket mb
         join stats.collectivite ca on true
         left join fiche_action fa using (collectivite_id)
group by mb.first_day, ca.region_code
union all
select mb.first_day                                         as mois,
       null::character varying                              as code_region,
       ca.departement_code                                  as code_departement,
       count(*) filter (where fa.created_at <= mb.last_day) as fiches
from stats.monthly_bucket mb
         join stats.collectivite ca on true
         left join fiche_action fa using (collectivite_id)
group by mb.first_day, ca.departement_code
order by 1;

create view stats_locales_evolution_nombre_fiches
as
select *
from stats.locales_evolution_nombre_fiches;

-- évolution des activation
drop view stats_locales_evolution_total_activation;
drop materialized view stats.locales_evolution_total_activation;
create materialized view stats.locales_evolution_total_activation
as
select -- permet de filtrer
       m.first_day                              as mois,
       null:: varchar(2)                        as code_region,
       null::varchar(2)                         as code_departement,

       -- stats nationales
       (select count(*) as count
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day) as total,
       (select count(*) filter (where stats.is_fiscalite_propre(cu.nature_collectivite)) as count
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day) as total_epci,
       (select count(*) filter (where cu.type_collectivite = 'syndicat'::type_collectivite) as count
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day) as total_syndicat,
       (select count(*) filter (where cu.type_collectivite = 'commune'::type_collectivite) as count
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day) as total_commune,
       (select count(*) filter (where cu.type_collectivite != 'commune'::type_collectivite
           and cu.type_collectivite != 'syndicat'::type_collectivite
           and not stats.is_fiscalite_propre(cu.nature_collectivite)) as count
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day) as total_autre
from stats.monthly_bucket m

union all

select m.first_day as mois,
       r.code,
       null,
       (select count(*) filter ( where cu.region_code = r.code)
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day),
       (select count(*) filter ( where stats.is_fiscalite_propre(cu.nature_collectivite) and cu.region_code = r.code)
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day),
       (select count(*) filter ( where cu.type_collectivite = 'syndicat' and cu.region_code = r.code)
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day),
       (select count(*) filter ( where cu.type_collectivite = 'commune' and cu.region_code = r.code)
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day),
       (select count(*) filter ( where cu.type_collectivite != 'commune'::type_collectivite
           and cu.type_collectivite != 'syndicat'::type_collectivite
           and not stats.is_fiscalite_propre(cu.nature_collectivite)
           and cu.region_code = r.code)
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
       (select count(*) filter ( where stats.is_fiscalite_propre(cu.nature_collectivite) and departement_code = d.code)
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day),
       (select count(*) filter ( where cu.type_collectivite = 'syndicat' and departement_code = d.code)
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day),
       (select count(*) filter ( where cu.type_collectivite = 'commune' and departement_code = d.code)
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day),
       (select count(*) filter ( where cu.type_collectivite != 'commune'::type_collectivite
           and cu.type_collectivite != 'syndicat'::type_collectivite
           and not stats.is_fiscalite_propre(cu.nature_collectivite)
           and departement_code = d.code)
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day)

from imports.departement d
         join stats.monthly_bucket m on true;

create view stats_locales_evolution_total_activation as
select *
from stats.locales_evolution_total_activation;

COMMIT;
