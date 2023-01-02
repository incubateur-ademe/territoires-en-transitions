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
end ;
$$ language plpgsql security definer;

COMMIT;
