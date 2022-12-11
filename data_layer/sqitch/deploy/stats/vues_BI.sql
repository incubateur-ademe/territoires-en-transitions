-- Deploy tet:stats/vues_BI to pg

BEGIN;

create view stats.monthly_bucket
as
with serie as (select generate_series(0, extract(month from age(now(), date '2022-01-01'))) as m),
     month as
         (select date '2022-01-01' + interval '1 month' * serie.m as start
          from serie)
select month.start::date                                  as first_day,
       (month.start + (interval '1 month - 1 day'))::date as last_day
from month;


create table stats.iso_3166
(
    type     varchar,
    code     varchar(6),
    nom      varchar,
    variante varchar,
    langue   varchar
);


create materialized view stats.collectivite
as
with
    -- get population and drom from insee.
    meta_commune as (select com.collectivite_id,
                            ic.population,
                            ic.code    as insee,
                            ir.code    as region_code,
                            ir.libelle as region_name,
                            id.code    as departement_code,
                            id.libelle as departement_name
                     from commune com
                              left join imports.commune ic on ic.code = com.code
                              left join imports.region ir on ic.region_code = ir.code
                              left join imports.departement id on ic.departement_code = id.code),
    -- get population from banatic and drom from insee.
    meta_epci as (select epci.collectivite_id,
                         ib.population,
                         ib.siren,
                         ib.nature,
                         ir.code    as region_code,
                         ir.libelle as region_name,
                         id.code    as departement_code,
                         id.libelle as departement_name
                  from epci
                           left join imports.banatic ib on ib.siren = epci.siren
                           left join imports.region ir on ib.region_code = ir.code
                           left join imports.departement id on ib.departement_code = id.code),

    -- compute type from table and epci nature
    type_collectivite as (select c.id                       as collectivite_id,
                                 case
                                     when c.id in (select collectivite_id from commune) then 'commune'
                                     when e.nature = 'SMF' or e.nature = 'SIVOM' or e.nature = 'SMO' or
                                          e.nature = 'SIVU' then
                                         'syndicat'
                                     else 'EPCI'
                                     end::type_collectivite as type
                          from collectivite c
                                   left join epci e on c.id = e.collectivite_id),
    info as (
-- coalesce null values from epci or collectivite data.
        select c.collectivite_id,
               c.nom,
               tc.type                                                as type_collectivite,
               coalesce(me.nature::varchar, tc.type::varchar)         as nature_collectivite,
               coalesce(mc.insee, me.siren, '')                       as code_siren_insee,
               coalesce(mc.region_name, me.region_name, '')           as region_name,
               coalesce(mc.region_code, me.region_code, '')           as region_code,
               coalesce(mc.departement_name, me.departement_name, '') as departement_name,
               coalesce(mc.departement_code, me.departement_code, '') as departement_code,
               coalesce(mc.population, me.population, 0)::int4        as population_totale
        from named_collectivite c
                 left join meta_commune mc on mc.collectivite_id = c.collectivite_id
                 left join meta_epci me on me.collectivite_id = c.collectivite_id
                 left join type_collectivite tc on tc.collectivite_id = c.collectivite_id
        where c.collectivite_id not in (select t.collectivite_id from collectivite_test t))
select info.collectivite_id,
       info.nom,
       info.type_collectivite,
       info.nature_collectivite,
       info.code_siren_insee,
       info.region_name,
       info.region_code,
       info.departement_name,
       info.departement_code,
       info.population_totale,
       id.code as departement_iso_3166,
       ir.code as region_iso_3166
from info
         left join stats.iso_3166 id on id.nom = departement_name
         left join stats.iso_3166 ir on ir.nom = region_name
;
comment on materialized view stats.collectivite
    is 'Toutes les collectivités.';

create materialized view stats.collectivite_referentiel
as
select c.*,
       etoiles_cae,
       etoiles_eci,
       etoiles_all,
       score_fait_cae,
       score_fait_eci,
       score_fait_min,
       score_fait_max,
       score_fait_sum,
       score_programme_cae,
       score_programme_eci,
       score_programme_max,
       score_programme_sum,
       completude_cae,
       completude_eci,
       completude_min,
       completude_max,
       population_intervalle,
       completude_cae_intervalle,
       completude_eci_intervalle,
       completude_intervalles,
       fait_cae_intervalle,
       fait_eci_intervalle,
       fait_intervalles
from collectivite_card
         join stats.collectivite c using (collectivite_id);
comment on materialized view stats.collectivite
    is 'Les collectivités liées aus données des référentiels, comporte uniquement les collectivités actives.';

create materialized view stats.collectivite_labellisation
as
select c.*,
       l.referentiel,
       l.obtenue_le,
       l.annee,
       l.etoiles,
       l.score_realise,
       l.score_programme
from labellisation l
         join stats.collectivite c using (collectivite_id);
comment on materialized view stats.collectivite_labellisation
    is 'Les collectivités liées aux données historiques de labellisation.';


create materialized view stats.collectivite_utilisateur
as
with utilisateurs as (select collectivite_id, count(*) as utilisateurs, min(created_at) as date_activation
                      from private_utilisateur_droit
                      where active
                      group by collectivite_id)
select c.*,
       u.utilisateurs,
       u.date_activation
from utilisateurs u
         join stats.collectivite c using (collectivite_id);
comment on materialized view stats.collectivite_labellisation
    is 'Les collectivités liées aux données utilisateurs.';


create materialized view stats.collectivite_plan_action
as
with fa as (select collectivite_id,
                   count(*) as count
            from fiche_action f
            group by f.collectivite_id),
     pa as (select collectivite_id,
                   count(*) as count
            from plan_action p
            group by p.collectivite_id)
select c.*,
       coalesce(fa.count, 0) as fiches,
       coalesce(pa.count, 0) as plans
from stats.collectivite c
         left join pa on pa.collectivite_id = c.collectivite_id
         left join fa on pa.collectivite_id = fa.collectivite_id
order by fiches desc;


create materialized view stats.collectivite_action_statut
as
with statut_count as (select collectivite_id, count(*) as count
                      from action_statut
                      group by collectivite_id)
select c.*, coalesce(count, 0) as statuts
from statut_count
         join stats.collectivite c using (collectivite_id);


create function
    stats.refresh_views()
    returns void
as
$$
begin
    refresh materialized view stats.collectivite;
    refresh materialized view stats.collectivite_referentiel;
    refresh materialized view stats.collectivite_labellisation;
    refresh materialized view stats.collectivite_utilisateur;
    refresh materialized view stats.collectivite_plan_action;
    refresh materialized view stats.collectivite_action_statut;
end ;
$$ language plpgsql security definer;
comment on function stats.refresh_views is
    'Rafraichit les vues stats.';

COMMIT;
