-- Deploy tet:stats/fonctionalite to pg
-- requires: utilisateur/droits
-- requires: referentiel/contenu
-- requires: plan_action/plan_action
-- requires: indicateur/referentiel

BEGIN;

create view stats_functionnalities_usage_proportion as
(
with active_collectivite as (
    select distinct collectivite_id
    from private_utilisateur_droit
    where active
),
     fiches as (
         select collectivite_id,
                count(collectivite_id) as count
         from fiche_action
         group by collectivite_id
     ),
     eci_statuses as (
         select collectivite_id,
                count(collectivite_id) as count
         from action_statut a_s
                  join action_relation a_r on a_r.id = a_s.action_id
         where a_r.referentiel = 'eci'
         group by collectivite_id
     ),
     cae_statuses as (
         select collectivite_id,
                count(collectivite_id) as count
         from action_statut a_s
                  join action_relation a_r on a_r.id = a_s.action_id
         where a_r.referentiel = 'cae'
         group by collectivite_id
     ),
     indicateurs as (
         select collectivite_id,
                count(collectivite_id) as count
         from indicateur_resultat
         group by collectivite_id
     ),
     indicateurs_perso as (
         select collectivite_id,
                count(collectivite_id) as count
         from indicateur_personnalise_resultat
         group by collectivite_id
     ),
     utilisateurs as (
         select collectivite_id,
                count(collectivite_id) as count
         from private_utilisateur_droit
         where active
         group by collectivite_id
     )
select avg(coalesce(fiches, 0))                   as fiche_action_avg,
       avg(coalesce(cae_statuses, 0))             as cae_statuses_avg,
       avg(coalesce(eci_statuses, 0))             as eci_statuses_avg,
       avg(coalesce(indicateurs_referentiels, 0)) as indicateur_referentiel_avg,
       avg(coalesce(indicateurs_perso, 0))        as indicateur_personnalise_avg
from (
         select (fiches.count >= 5)::integer            as fiches,
                (eci_statuses.count >= 20)::integer     as eci_statuses,
                (cae_statuses.count >= 20)::integer     as cae_statuses,
                (indicateurs.count >= 5)::integer       as indicateurs_referentiels,
                (indicateurs_perso.count >= 1)::integer as indicateurs_perso
         from active_collectivite a_c
                  full join fiches on fiches.collectivite_id = a_c.collectivite_id
                  full join eci_statuses on eci_statuses.collectivite_id = a_c.collectivite_id
                  full join cae_statuses on cae_statuses.collectivite_id = a_c.collectivite_id
                  full join indicateurs on indicateurs.collectivite_id = a_c.collectivite_id
                  full join indicateurs_perso on indicateurs_perso.collectivite_id = a_c.collectivite_id
                  full join utilisateurs on utilisateurs.collectivite_id = a_c.collectivite_id
         where utilisateurs.collectivite_id is not null
     ) as per_collectivite
    );

COMMIT;
