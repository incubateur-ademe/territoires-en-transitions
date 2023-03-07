-- Deploy tet:stats/locale to pg

BEGIN;

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
       (select count(*) filter (where cu.type_collectivite = 'EPCI'::type_collectivite) as count
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
create view stats_locales_evolution_total_activation as
select *
from stats.locales_evolution_total_activation;


create materialized view stats.locales_collectivite_actives_et_total_par_type
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
       null:: varchar(2)                                                                                    as code_region,
       null::varchar(2)                                                                                     as code_departement,
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

create view stats_locales_collectivite_actives_et_total_par_type as
select *
from stats.locales_collectivite_actives_et_total_par_type;


create materialized view stats.locales_evolution_nombre_utilisateur_par_collectivite
as
with membres as (select c                                                         as collectivite,
                        mb.first_day                                              as mois,
                        count(*)
                        filter ( where active and pud.created_at <= mb.last_day ) as nombre
                 from stats.monthly_bucket mb
                          join stats.collectivite c on true
                          left join private_utilisateur_droit pud using (collectivite_id)
                 group by c,
                          mb.first_day)
select mois,
       null:: varchar(2)                                                                 as code_region,
       null::varchar(2)                                                                  as code_departement,
       avg(nombre) filter ( where nombre > 0 )                                           as moyen,
       max(nombre) filter ( where nombre > 0 )                                           as maximum,
       percentile_cont(0.5) within group ( order by nombre ) filter ( where nombre > 0 ) as median
from membres
group by mois

union all

select mois,
       (membres.collectivite).region_code,
       null,
       avg(nombre) filter ( where nombre > 0 ),
       max(nombre) filter ( where nombre > 0 ),
       percentile_cont(0.5) within group ( order by nombre ) filter ( where nombre > 0 )
from membres
group by mois, (membres.collectivite).region_code

union all

select mois,
       null,
       (membres.collectivite).departement_code,
       avg(nombre) filter ( where nombre > 0 ),
       max(nombre) filter ( where nombre > 0 ),
       percentile_cont(0.5) within group ( order by nombre ) filter ( where nombre > 0 )
from membres
group by mois, (membres.collectivite).departement_code;

create view stats_locales_evolution_nombre_utilisateur_par_collectivite as
select *
from stats.locales_evolution_nombre_utilisateur_par_collectivite;


create materialized view stats.locales_pourcentage_completude
as
with score as (select collectivite_id, jsonb_array_elements(scores) as o from client_scores),
     eci as (select collectivite_id,
                    (o ->> 'completed_taches_count')::integer as completed_taches_count,
                    (o ->> 'total_taches_count')::integer     as total_taches_count
             from score
             where o @> '{"action_id": "eci"}'),
     cae as (select collectivite_id,
                    (o ->> 'completed_taches_count')::integer as completed_taches_count,
                    (o ->> 'total_taches_count')::integer     as total_taches_count
             from score
             where o @> '{"action_id": "cae"}')

select c.collectivite_id,
       c.region_code,
       c.departement_code,
       coalesce((eci.completed_taches_count::float / eci.total_taches_count::float) * 100, 0) as completude_eci,
       coalesce((cae.completed_taches_count::float / cae.total_taches_count::float) * 100, 0) as completude_cae
from stats.collectivite c
         left join eci on eci.collectivite_id = c.collectivite_id
         left join cae on cae.collectivite_id = c.collectivite_id
order by c.collectivite_id;


create materialized view stats.locales_tranche_completude
as
with bounds as (select unnest('{0, 20, 50, 80,  100}'::numeric[]) as bound),
     ranges as (select numrange(lower.bound, upper.bound) as range,
                       lower.bound                        as lower_bound,
                       upper.bound                        as upper_bound
                from bounds lower
                         left join lateral (select * from bounds b where b.bound > lower.bound limit 1) upper on true)
select lower_bound,
       upper_bound,
       null:: varchar(2) as code_region,
       null::varchar(2)  as code_departement,
       eci,
       cae
from ranges r
         left join lateral (select count(*) filter ( where r.range @> c.completude_eci::numeric ) as eci,
                                   count(*) filter ( where r.range @> c.completude_cae::numeric ) as cae
                            from stats.locales_pourcentage_completude c) in_range on true

union all

select lower_bound,
       upper_bound,
       r.code,
       null,
       eci,
       cae
from imports.region r
         join ranges on true
         left join lateral (select count(*)
                                   filter ( where ranges.range @> c.completude_eci::numeric and c.region_code = r.code) as eci,
                                   count(*)
                                   filter ( where ranges.range @> c.completude_cae::numeric and c.region_code = r.code) as cae
                            from stats.locales_pourcentage_completude c) in_range on true

union all

select lower_bound,
       upper_bound,
       null,
       d.code,
       eci,
       cae
from imports.departement d
         join ranges on true
         left join lateral (select count(*) filter ( where ranges.range @> c.completude_eci::numeric and
                                                           c.departement_code = d.code) as eci,
                                   count(*) filter ( where ranges.range @> c.completude_cae::numeric and
                                                           c.departement_code = d.code) as cae
                            from stats.locales_pourcentage_completude c) in_range on true;

create view stats_locales_tranche_completude as select * from stats.locales_tranche_completude;


create function
    stats.refresh_stats_locales()
    returns void
as
$$
begin
    refresh materialized view stats.locales_evolution_total_activation;
    refresh materialized view stats.locales_collectivite_actives_et_total_par_type;
    refresh materialized view stats.locales_evolution_nombre_utilisateur_par_collectivite;
    refresh materialized view stats.locales_pourcentage_completude;
    refresh materialized view stats.locales_tranche_completude;
end
$$ language plpgsql;
comment on function stats.refresh_stats_locales is
    'Rafraichit les vues matérialisées des stats régionales et départementales.';


COMMIT;
