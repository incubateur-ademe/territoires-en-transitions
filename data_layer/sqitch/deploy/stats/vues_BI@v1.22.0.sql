-- Deploy tet:stats/vues_BI to pg

BEGIN;

create materialized view stats.evolution_indicateur_referentiel
as
with indicateurs as (select collectivite_id,
                            indicateur_id,
                            min(modified_at) as first_modified_at
                     from indicateur_resultat
                              join stats.collectivite_active using (collectivite_id)
                     group by collectivite_id, indicateur_id)
select first_day as mois,
       count(*)  as indicateurs
from stats.monthly_bucket m
         left join indicateurs on indicateurs.first_modified_at <= last_day
group by first_day
order by first_day;

create view stats_evolution_indicateur_referentiel
as
select *
from stats.evolution_indicateur_referentiel;

create materialized view stats.evolution_resultat_indicateur_referentiel
as
select first_day as mois,
       count(*)  as resultats
from stats.monthly_bucket m
         left join indicateur_resultat ir on ir.modified_at <= last_day
         join stats.collectivite_active using (collectivite_id)
group by first_day
order by first_day;

create view stats_evolution_resultat_indicateur_referentiel
as
select *
from stats.evolution_resultat_indicateur_referentiel;

create materialized view stats.evolution_resultat_indicateur_personnalise
as
select first_day as mois,
       count(*)  as resultats
from stats.monthly_bucket m
         left join indicateur_personnalise_resultat ipr on ipr.modified_at <= last_day
         join stats.collectivite_active using (collectivite_id)
group by first_day
order by first_day;

create view stats_evolution_resultat_indicateur_personnalise
as
select *
from stats.evolution_resultat_indicateur_personnalise;

create materialized view stats.engagement_collectivite
as
select collectivite_id,
       coalesce(cot.actif, false) as cot,
       coalesce(eci.etoiles, 0)   as etoiles_eci,
       coalesce(cae.etoiles, 0)   as etoiles_cae
from stats.collectivite c
         left join cot using (collectivite_id)
         left join lateral (select etoiles
                            from labellisation l
                            where l.collectivite_id = c.collectivite_id
                              and referentiel = 'eci') eci on true
         left join lateral (select etoiles
                            from labellisation l
                            where l.collectivite_id = c.collectivite_id
                              and referentiel = 'cae') cae on true;

create view stats_engagement_collectivite
as
select *
from stats.engagement_collectivite;


drop function stats.refresh_views();
drop view stats_carte_epci_par_departement;
drop materialized view stats.carte_epci_par_departement;
drop view stats_collectivite_actives_et_total_par_type;
drop materialized view stats.collectivite_actives_et_total_par_type;

create function
    stats.is_fiscalite_propre(nature varchar)
    returns bool
begin
    atomic
    return nature = 'CU'
        or nature = 'CC'
        or nature = 'CA'
        or nature = 'METRO';
end;
comment on function stats.is_fiscalite_propre is
    'Vrai si la nature correspond aux EPCI à fiscalité propre.';


create materialized view stats.carte_epci_par_departement
as
with epcis_departement as (select c.departement_code                                                    as insee,
                                  count(*)                                                              as total,
                                  count(*)
                                  filter ( where collectivite_id in (table stats.collectivite_active) ) as actives
                           from stats.collectivite c
                           where stats.is_fiscalite_propre(nature_collectivite)
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
with collectivite as (select c.collectivite_id,
                             case
                                 when stats.is_fiscalite_propre(c.nature_collectivite) then 'EPCI'
                                 when c.type_collectivite = 'syndicat' then 'syndicat'
                                 when c.type_collectivite = 'commune' then 'commune' end as typologie
                      from stats.collectivite c)

select typologie,
       count(*)                                                                                             as total,
       count(*) filter ( where collectivite_id in (select collectivite_id from stats.collectivite_active) ) as actives
from collectivite
group by typologie;

create view stats_collectivite_actives_et_total_par_type
as
select typologie as type_collectivite, total, actives
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
    refresh materialized view stats.evolution_indicateur_referentiel;
    refresh materialized view stats.evolution_resultat_indicateur_referentiel;
    refresh materialized view stats.evolution_resultat_indicateur_personnalise;
    refresh materialized view stats.engagement_collectivite;
end ;
$$ language plpgsql security definer;

COMMIT;
