-- Deploy tet:stats/vues_BI to pg

BEGIN;

create materialized view stats.carte_collectivite_active
as
select c.collectivite_id,
       c.nom,
       c.type_collectivite,
       c.nature_collectivite,
       c.code_siren_insee,
       c.region_name,
       c.region_code,
       c.departement_name,
       c.departement_code,
       c.population_totale,
       geo.geojson
from stats.collectivite_active a
         join stats.collectivite c using (collectivite_id)
         join stats.collectivite_geojson geo on geo.siren_insee = c.code_siren_insee;
comment on materialized view stats.carte_collectivite_active
    is 'Les collectivités actives avec leurs contours.';

-- Expose la vue sur l'API public.
create view public.stats_carte_collectivite_active
as
select *
from stats.carte_collectivite_active;
comment on view public.stats_carte_collectivite_active
    is 'Les collectivités actives avec leurs contours.';

-- Evolution des collectivités activées.
create materialized view stats.evolution_total_activation_par_type
as
select m.first_day                              as mois,
       (select count(*)
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day) as total,
       (select count(*) filter ( where cu.type_collectivite = 'EPCI' )
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day) as total_epci,
       (select count(*) filter ( where cu.type_collectivite = 'syndicat' )
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day) as total_syndicat,
       (select count(*) filter ( where cu.type_collectivite = 'commune' )
        from stats.collectivite_utilisateur cu
        where cu.date_activation <= m.last_day) as total_commune
from stats.monthly_bucket m;

create view stats_evolution_total_activation_par_type
as
select *
from stats.evolution_total_activation_par_type;


create materialized view stats.collectivite_actives_et_total_par_type
as
select type_collectivite,
       count(*)                                                                                             as total,
       count(*) filter ( where collectivite_id in (select collectivite_id from stats.collectivite_active) ) as actives
from stats.collectivite
group by type_collectivite;

create view stats_collectivite_actives_et_total_par_type
as
select *
from stats.collectivite_actives_et_total_par_type;

-- expose les stats du nombre d'utilisateurs à l'API
create view stats_evolution_utilisateur
as
select *
from stats.evolution_utilisateur;

create materialized view stats.evolution_nombre_utilisateur_par_collectivite
as
with membres as (select collectivite_id,
                        mb.first_day                                                                  as mois,
                        count(*)
                        filter ( where active and pud.created_at <= mb.last_day and pcm is not null ) as nombre
                 from stats.monthly_bucket mb
                          cross join stats.collectivite_active
                          left join private_utilisateur_droit pud using (collectivite_id)
                          left join private_collectivite_membre pcm using (collectivite_id, user_id)
                 group by collectivite_id,
                          mb.first_day)
select mois,
       avg(nombre)                                           as moyen,
       max(nombre)                                           as maximum,
       percentile_cont(0.5) within group ( order by nombre ) as median
from membres
group by mois
order by mois;

create view stats_evolution_nombre_utilisateur_par_collectivite
as
select *
from stats.evolution_nombre_utilisateur_par_collectivite;

create materialized view stats.carte_epci_par_departement
as
with epcis_departement as (select c.departement_code                                                    as insee,
                                  count(*)                                                              as total,
                                  count(*)
                                  filter ( where collectivite_id in (table stats.collectivite_active) ) as actives
                           from stats.collectivite c
                           where type_collectivite = 'EPCI'
                           group by c.departement_code)
select insee,
       libelle,
       total,
       actives,
       geojson
from epcis_departement
         join stats.departement_geojson using (insee);

create view stats_carte_epci_par_departement
as
select *
from stats.carte_epci_par_departement;

create materialized view stats.pourcentage_completude
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
       (eci.completed_taches_count::float / eci.total_taches_count::float) * 100 as completude_eci,
       (cae.completed_taches_count::float / cae.total_taches_count::float) * 100 as completude_cae
from stats.collectivite_active c
         left join eci on eci.collectivite_id = c.collectivite_id
         left join cae on cae.collectivite_id = c.collectivite_id
order by c.collectivite_id;

create materialized view stats.evolution_collectivite_avec_minimum_fiches
as
with fiche_collecticite as (select first_day                                               as mois,
                                   collectivite_id,
                                   count(*) filter ( where fa.modified_at <= mb.last_day ) as fiches
                            from stats.monthly_bucket mb
                                     join stats.collectivite_active ca on true
                                     join fiche_action fa using (collectivite_id)
                            group by mb.first_day, collectivite_id)
select mois,
       count(*) filter ( where fiches > 5 ) as collectivites
from fiche_collecticite
group by mois
order by mois;

create view stats_evolution_collectivite_avec_minimum_fiches
as
select *
from stats.evolution_collectivite_avec_minimum_fiches;

create or replace function
    stats.refresh_views()
    returns void
as
$$
begin
    refresh materialized view stats.collectivite;
    refresh materialized view stats.collectivite_utilisateur;
    refresh materialized view stats.collectivite_referentiel;
    refresh materialized view stats.collectivite_labellisation;
    refresh materialized view stats.collectivite_plan_action;
    refresh materialized view stats.collectivite_action_statut;
    refresh materialized view stats.evolution_activation;
    refresh materialized view stats.rattachement;
    refresh materialized view stats.utilisateur;
    refresh materialized view stats.evolution_utilisateur;
    refresh materialized view stats.connection;
    refresh materialized view stats.evolution_connection;
    refresh materialized view stats.carte_collectivite_active;
    refresh materialized view stats.evolution_total_activation_par_type;
    refresh materialized view stats.collectivite_actives_et_total_par_type;
    refresh materialized view stats.evolution_nombre_utilisateur_par_collectivite;
    refresh materialized view stats.carte_epci_par_departement;
    refresh materialized view stats.pourcentage_completude;
    refresh materialized view stats.evolution_collectivite_avec_minimum_fiches;
end ;
$$ language plpgsql security definer;

COMMIT;
