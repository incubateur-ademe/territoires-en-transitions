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
end ;
$$ language plpgsql security definer;

COMMIT;
