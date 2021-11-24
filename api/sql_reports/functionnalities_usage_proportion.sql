with real_epci as (
    select uid
    from epci
    where siren != ''
),  fiches as (
    select epci_id,
           count(epci_id) as count
    from ficheaction
    where latest
    group by epci_id
),
     eci_statuses as (
         select epci_id,
                count(epci_id) as count
         from actionstatus
         where latest
         and action_id like 'economie_circulaire%'
         group by epci_id

     ),
     cae_statuses as (
         select epci_id,
                count(epci_id) as count
         from actionstatus
         where latest
           and action_id like 'citergie%'
         group by epci_id
     ),
     indicateurs as (
         select epci_id,
                count(epci_id) as count
         from indicateurresultat
         where latest
         group by epci_id
     ),
     indicateurs_perso as (
         select epci_id,
                count(epci_id) as count
         from indicateurpersonnaliseresultat
         where latest
         group by epci_id
     ),
     utilisateurs as (
         select epci_id,
                count(epci_id) as count
         from utilisateurdroits
         where latest
         group by epci_id
     )
select avg(coalesce(fiches, 0)) as fiche_action_avg,
       avg(coalesce(cae_statuses, 0)) as cae_statuses_avg,
       avg(coalesce(eci_statuses, 0)) as eci_statuses_avg,
       avg(coalesce(indicateurs_referentiels, 0)) as indicateur_referentiel_avg,
       avg(coalesce(indicateurs_perso, 0)) as indicateur_personnalise_avg
from (
         select (fiches.count >= 5)::integer as fiches,
                (eci_statuses.count >= 20)::integer as eci_statuses,
                (cae_statuses.count >= 20)::integer as cae_statuses,
                (indicateurs.count >= 5)::integer as indicateurs_referentiels,
                (indicateurs_perso.count >= 1)::integer as indicateurs_perso
         from real_epci
                  full join fiches on fiches.epci_id = uid
                  full join eci_statuses on eci_statuses.epci_id = uid
                  full join cae_statuses on cae_statuses.epci_id = uid
                  full join indicateurs on indicateurs.epci_id = uid
                  full join indicateurs_perso on indicateurs_perso.epci_id = uid
                  full join utilisateurs on utilisateurs.epci_id = uid
         where utilisateurs.epci_id is not null
     ) as per_epci;
;
