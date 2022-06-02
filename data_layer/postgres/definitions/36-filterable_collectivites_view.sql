create view region
as
select code, libelle
from imports.region;

create view departement
as
select code, libelle, region_code
from imports.departement;

create type filterable_type_collectivite
as enum ('commune', 'syndicat', 'CU', 'CC', 'POLEM', 'METRO', 'CA', 'EPT', 'PETR');

create or replace view collectivite_card
as
with
    -- get population and drom from insee.
    meta_commune as (select com.collectivite_id,
                            ic.population,
                            ic.code as insee,
                            ir.code as region_code,
                            id.code as departement_code
                     from commune com
                              left join imports.commune ic on ic.code = com.code
                              left join imports.region ir on ic.region_code = ir.code
                              left join imports.departement id on ic.departement_code = id.code),
    -- get population from banatic and drom from insee.
    meta_epci as (select epci.collectivite_id,
                         ib.population,
                         ib.siren,
                         ir.code as region_code,
                         id.code as departement_code
                  from epci
                           left join imports.banatic ib on ib.siren = epci.siren
                           left join imports.region ir on ib.region_code = ir.code
                           left join imports.departement id on ib.departement_code = id.code),

    -- compute type from table and epci nature
    type_collectivite as (select c.id                                  as collectivite_id,
                                 case
                                     when c.id in (select collectivite_id from commune) then 'commune'
                                     when e.nature = 'SMF' or e.nature = 'SIVOM' or e.nature = 'SMO' or
                                          e.nature = 'SIVU' then
                                         'syndicat'
                                     when e.nature = 'CU' then 'CU'
                                     when e.nature = 'CC' then 'CC'
                                     when e.nature = 'POLEM' then 'POLEM'
                                     when e.nature = 'METRO' then 'METRO'
                                     when e.nature = 'PETR' then 'PETR'
                                     when e.nature = 'EPT' then 'EPT'
                                     end::filterable_type_collectivite as type
                          from collectivite c
                                   left join epci e on c.id = e.collectivite_id),

    -- extract data from client scores
    referentiel_score as (select collectivite_id,
                                 max(s.score_fait) filter ( where referentiel = 'eci' )      as score_fait_eci,
                                 max(s.score_fait) filter ( where referentiel = 'cae' )      as score_fait_cae,
                                 max(s.score_programme) filter ( where referentiel = 'eci' ) as score_programme_eci,
                                 max(s.score_programme) filter ( where referentiel = 'cae' ) as score_programme_cae,
                                 max(s.completude) filter ( where referentiel = 'eci' )      as completude_eci,
                                 max(s.completude) filter ( where referentiel = 'cae' )      as completude_cae
                          from commune com
                                   join lateral (
                              select * from labellisation.referentiel_score(com.id)
                              ) s on true
                          group by collectivite_id),

    -- labellisation data
    labellisation as (select collectivite_id,
                             max(l.etoiles) filter ( where referentiel = 'cae' ) as etoiles_cae,
                             max(l.etoiles) filter ( where referentiel = 'eci' ) as etoiles_eci
                      from labellisation l
                      group by collectivite_id)

-- coalesce null values from epci or collectivité data.
select c.collectivite_id,
       c.nom,
       tc.type                                                as type_collectivite,
       coalesce(mc.insee, me.siren, '')                       as code_siren_insee,
       coalesce(mc.region_code, me.region_code, '')           as region_code,
       coalesce(mc.departement_code, me.departement_code, '') as departement_code,
       coalesce(mc.population, me.population, 0)::int4        as population,
       coalesce(l.etoiles_cae, 0)                             as etoiles_cae,
       coalesce(l.etoiles_eci, 0)                             as etoiles_eci,
       coalesce(s.score_fait_cae, 0)                          as score_fait_cae,
       coalesce(s.score_fait_eci, 0)                          as score_fait_eci,
       coalesce(s.score_programme_cae, 0)                     as score_programme_cae,
       coalesce(s.score_programme_eci, 0)                     as score_programme_eci,
       coalesce(s.completude_cae, 0)                          as completude_cae,
       coalesce(s.completude_eci, 0)                          as completude_eci

from named_collectivite c
         left join meta_commune mc on mc.collectivite_id = c.collectivite_id
         left join meta_epci me on me.collectivite_id = c.collectivite_id
         left join type_collectivite tc on tc.collectivite_id = c.collectivite_id
         left join labellisation l on l.collectivite_id = c.collectivite_id
         left join referentiel_score s on s.completude_eci = c.collectivite_id
where c.collectivite_id in (select collectivite_id from private_utilisateur_droit where active);





