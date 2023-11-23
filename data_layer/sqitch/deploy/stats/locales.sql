-- Deploy tet:stats/locale to pg

BEGIN;

-- locales_evolution_collectivite_avec_minimum_fiches
drop view stats_locales_evolution_collectivite_avec_minimum_fiches;
drop materialized view stats.locales_evolution_collectivite_avec_minimum_fiches;

create materialized view stats.locales_evolution_collectivite_avec_minimum_fiches as
with fiche_collectivite as (select mb.first_day                                                               as mois,
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
select mb.first_day                                          as mois,
       null::character varying(2)                            as code_region,
       null::character varying(2)                            as code_departement,
       count(*) filter (where fa.created_at <= mb.last_day) as fiches
from stats.monthly_bucket mb
         join stats.collectivite ca on true
         join fiche_action fa using (collectivite_id)
group by mb.first_day
union all
select mb.first_day                                          as mois,
       ca.region_code                                        as code_region,
       null::character varying                               as code_departement,
       count(*) filter (where fa.created_at <= mb.last_day) as fiches
from stats.monthly_bucket mb
         join stats.collectivite ca on true
         left join fiche_action fa using (collectivite_id)
group by mb.first_day, ca.region_code
union all
select mb.first_day                                          as mois,
       null::character varying                               as code_region,
       ca.departement_code                                   as code_departement,
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

COMMIT;
