-- Deploy tet:stats/locale to pg

BEGIN;

drop view stats_locales_labellisation_par_niveau;
drop materialized view stats.locales_labellisation_par_niveau;

create materialized view stats.locales_labellisation_par_niveau
as
with latest_labellisation as (select collectivite_id,
                                     referentiel,
                                     (select ll.etoiles
                                      from labellisation ll
                                      where ll.collectivite_id = l.collectivite_id
                                        and ll.referentiel = l.referentiel
                                      order by ll.obtenue_le desc
                                      limit 1) as etoiles
                              from labellisation l
                              group by collectivite_id, referentiel),
     labellisation_locales as (select l.etoiles, l.referentiel, c.region_code, c.departement_code
                               from latest_labellisation l
                                        join stats.collectivite c using (collectivite_id))

select null:: varchar(2) as code_region,
       null::varchar(2)  as code_departement,
       referentiel,
       etoiles,
       count(*)          as labellisations
from labellisation_locales
group by referentiel, etoiles

union all

select r.code,
       null,
       referentiel,
       etoiles,
       coalesce(count(l), 0)
from imports.region r
         join labellisation_locales l on l.region_code = r.code
group by referentiel, etoiles, r.code

union all

select null,
       d.code,
       referentiel,
       etoiles,
       coalesce(count(l), 0)
from imports.departement d
         join labellisation_locales l on l.departement_code = d.code
group by referentiel, etoiles, d.code;

create view stats_locales_labellisation_par_niveau
as
select *
from stats.locales_labellisation_par_niveau;

COMMIT;
