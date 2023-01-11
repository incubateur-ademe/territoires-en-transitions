-- Deploy tet:stats/vues_BI to pg

BEGIN;

drop function  stats.refresh_views();

drop view stats_carte_epci_par_departement;
drop materialized view stats.carte_epci_par_departement;
drop view stats_collectivite_actives_et_total_par_type;
drop materialized view stats.collectivite_actives_et_total_par_type;
drop view stats_evolution_indicateur_referentiel;
drop materialized view stats.evolution_indicateur_referentiel;
drop view stats_evolution_resultat_indicateur_referentiel;
drop materialized view stats.evolution_resultat_indicateur_referentiel;
drop view stats_evolution_resultat_indicateur_personnalise;
drop materialized view stats.evolution_resultat_indicateur_personnalise;
drop view stats_engagement_collectivite;
drop materialized view stats.engagement_collectivite;
drop function stats.is_fiscalite_propre;

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
    refresh materialized view stats.evolution_nombre_utilisateur_par_collectivite;
    refresh materialized view stats.carte_epci_par_departement;
    refresh materialized view stats.pourcentage_completude;
    refresh materialized view stats.evolution_collectivite_avec_minimum_fiches;
end ;
$$ language plpgsql security definer;

COMMIT;
