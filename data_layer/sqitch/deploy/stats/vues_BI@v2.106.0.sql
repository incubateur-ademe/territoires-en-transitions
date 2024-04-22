-- Deploy tet:stats/vues_BI to pg

BEGIN;

-- evolution_collectivite_avec_minimum_fiches
drop view stats_evolution_collectivite_avec_minimum_fiches;
drop materialized view stats.evolution_collectivite_avec_minimum_fiches;

create materialized view stats.evolution_collectivite_avec_minimum_fiches as
with fiche_collectivite as (select mb.first_day                                         as mois,
                                   ca.collectivite_id,
                                   count(*) filter (where fa.created_at <= mb.last_day) as fiches
                            from stats.monthly_bucket mb
                                     join stats.collectivite_active ca on true
                                     join fiche_action fa using (collectivite_id)
                            group by mb.first_day, ca.collectivite_id)
select fiche_collectivite.mois,
       count(*) filter (where fiche_collectivite.fiches > 5) as collectivites
from fiche_collectivite
group by fiche_collectivite.mois
order by fiche_collectivite.mois;

create view stats_evolution_collectivite_avec_minimum_fiches
as
select *
from stats.evolution_collectivite_avec_minimum_fiches;

-- evolution_nombre_fiches
drop view stats_evolution_nombre_fiches;
drop materialized view stats.evolution_nombre_fiches;

create materialized view stats.evolution_nombre_fiches as
select mb.first_day                                         as mois,
       count(*) filter (where fa.created_at <= mb.last_day) as fiches
from stats.monthly_bucket mb
         join stats.collectivite_active ca on true
         join fiche_action fa using (collectivite_id)
group by mb.first_day
order by mb.first_day;

create view stats_evolution_nombre_fiches
as
select *
from stats.evolution_nombre_fiches;

create materialized view stats.evolution_nombre_plans
as
select mb.first_day                                        as mois,
       count(*) filter (where a.created_at <= mb.last_day) as plans
from stats.monthly_bucket mb
         join stats.collectivite_active ca on true
         join axe a using (collectivite_id)
where a.parent is null
group by mb.first_day
order by mb.first_day;

create view stats_evolution_nombre_plans
as
select *
from stats.evolution_nombre_plans;

-- évolution des labellisations
create materialized view stats.evolution_nombre_labellisations
as
select mb.first_day                                                            as mois,
       count(*) filter (where l.obtenue_le <= mb.last_day and l.etoiles = '1') as etoile_1,
       count(*) filter (where l.obtenue_le <= mb.last_day and l.etoiles = '2') as etoile_2,
       count(*) filter (where l.obtenue_le <= mb.last_day and l.etoiles = '3') as etoile_3,
       count(*) filter (where l.obtenue_le <= mb.last_day and l.etoiles = '4') as etoile_4,
       count(*) filter (where l.obtenue_le <= mb.last_day and l.etoiles = '5') as etoile_5
from stats.monthly_bucket mb
         join labellisation l on true
group by mb.first_day
order by mb.first_day;

create view stats_evolution_nombre_labellisations
as
select *
from stats.evolution_nombre_labellisations;


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
    refresh materialized view stats.evolution_nombre_fiches;
    refresh materialized view stats.evolution_nombre_plans;
    refresh materialized view stats.evolution_nombre_labellisations;
end ;
$$ language plpgsql security definer;

COMMIT;
