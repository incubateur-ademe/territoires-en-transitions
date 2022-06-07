create or replace view region
as
select code, libelle
from imports.region
order by naturalsort(libelle);

create or replace view departement
as
select code, libelle, region_code
from imports.departement
order by code;

create type filterable_type_collectivite
as enum ('commune', 'syndicat', 'CU', 'CC', 'POLEM', 'METRO', 'CA', 'EPT', 'PETR');

create type collectivite_filtre_type
as enum ('population', 'score', 'remplissage');

create table filtre_intervalle
(
    type       collectivite_filtre_type not null,
    id         varchar(30)              not null,
    libelle    text                     not null,
    intervalle int4range                not null,
    primary key (type, id)
);

insert into filtre_intervalle
values ('population', '<20000', 'Moins de 20 000', '[0,20000]'),
       ('population', '20000-50000', '20 000 - 50 000', '[20000,50000]'),
       ('population', '50000-100000', '50 000 - 100 000', '[50000,100000]'),
       ('population', '100000-200000', '100 000 - 200 000', '[100000,200000]'),
       ('population', '>200000', 'Plus de 200 000', '[200000,]'),
       --
       ('score', '0-34', '0 à 34 %', '[0,35)'),
       ('score', '35-49', '35 à 49 %', '[35,50)'),
       ('score', '50-64', '50 à 64 %', '[50,65)'),
       ('score', '65-74', '65 à 74 %', '[65,75)'),
       ('score', '75-100', '75 à 100 %', '[75,]'),
       --
       ('remplissage', '0', '0', '[0,0]'),
       ('remplissage', '0-49', '0 à 50 %', '(0,50)'),
       ('remplissage', '50-79', '50 à 79 %', '[50,80)'),
       ('remplissage', '80-99', '80 à 99 %', '[80,100)'),
       ('remplissage', '100', '100 %', '[100,]');


create materialized view collectivite_card
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
                                     when e.nature = 'CA' then 'CA'
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
    referentiel_score as (select c.id                                                        as collectivite_id,
                                 max(s.score_fait) filter ( where referentiel = 'eci' )      as score_fait_eci,
                                 max(s.score_fait) filter ( where referentiel = 'cae' )      as score_fait_cae,
                                 max(s.score_fait)                                           as score_fait_max,
                                 max(s.score_programme) filter ( where referentiel = 'eci' ) as score_programme_eci,
                                 max(s.score_programme) filter ( where referentiel = 'cae' ) as score_programme_cae,
                                 max(s.score_programme)                                      as score_programme_max,
                                 max(s.completude) filter ( where referentiel = 'eci' )      as completude_eci,
                                 max(s.completude) filter ( where referentiel = 'cae' )      as completude_cae,
                                 max(s.completude)                                           as completude_max
                          from collectivite c
                                   join lateral (
                              select * from labellisation.referentiel_score(c.id)
                              ) s on true
                          group by collectivite_id),

    -- labellisation data
    labellisation as (select collectivite_id,
                             max(l.etoiles) filter ( where referentiel = 'cae' ) as etoiles_cae,
                             max(l.etoiles) filter ( where referentiel = 'eci' ) as etoiles_eci,
                             array_agg(l.etoiles)                                as etoiles_all
                      from labellisation l
                      group by collectivite_id),
    -- coalesce null values from epci or collectivité data.
    card as (select c.collectivite_id,
                    c.nom,
                    tc.type                                                as type_collectivite,
                    coalesce(mc.insee, me.siren, '')                       as code_siren_insee,
                    coalesce(mc.region_code, me.region_code, '')           as region_code,
                    coalesce(mc.departement_code, me.departement_code, '') as departement_code,
                    coalesce(mc.population, me.population, 0)::int4        as population,
                    coalesce(l.etoiles_cae, 0)                             as etoiles_cae,
                    coalesce(l.etoiles_eci, 0)                             as etoiles_eci,
                    coalesce(l.etoiles_all, '{}')                          as etoiles_all,
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
                      left join referentiel_score s on s.collectivite_id = c.collectivite_id)
-- add filter bucket to card
select card.*,
       pop.id      as population_intervalle,
       comp_cae.id as completude_cae_intervalle,
       comp_eci.id as completude_eci_intervalle,
       comps.ids   as completude_intervalles,
       fait_cae.id as fait_cae_intervalle,
       fait_eci.id as fait_eci_intervalle,
       scores.ids  as fait_intervalles

from card
         -- population
         left join lateral (select id
                            from filtre_intervalle
                            where type = 'population'
                              and intervalle @> card.population
                            limit 1) pop on true
    -- remplissage
         left join lateral (select id
                            from filtre_intervalle
                            where type = 'remplissage'
                              and intervalle @> (card.completude_cae * 100)::int4
                            limit 1) comp_cae on true
         left join lateral (select id
                            from filtre_intervalle
                            where type = 'remplissage'
                              and intervalle @> (card.completude_eci * 100)::int4
                            limit 1) comp_eci on true
         left join lateral (select array_agg(id) as ids
                            from filtre_intervalle
                            where type = 'remplissage'
                              and (intervalle @> (card.completude_cae * 100)::int4
                                or intervalle @> (card.completude_eci * 100)::int4)) comps on true
    -- score
         left join lateral (select id
                            from filtre_intervalle
                            where type = 'score'
                              and intervalle @> (card.score_fait_eci * 100)::int4
                            limit 1) fait_eci on true
         left join lateral (select id
                            from filtre_intervalle
                            where type = 'score'
                              and intervalle @> (card.score_fait_cae * 100)::int4
                            limit 1) fait_cae on true
         left join lateral (select array_agg(id) as ids
                            from filtre_intervalle
                            where type = 'score'
                              and (intervalle @> (card.score_fait_eci * 100)::int4
                                or intervalle @> (card.score_fait_cae * 100)::int4)) scores on true

-- keep only active collectivités only.
where card.collectivite_id in (select collectivite_id from private_utilisateur_droit where active);
