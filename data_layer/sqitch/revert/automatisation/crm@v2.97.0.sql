-- Deploy tet:utils/automatisation to pg

BEGIN;

drop view crm_usages;
drop materialized view stats.crm_usages;

create materialized view stats.crm_usages
as
with premier_rattachements as (select collectivite_id,
                                      min(created_at
                                      )::date as date
                               from private_utilisateur_droit
                               where active
                               group by collectivite_id),
     comptes as (select c.collectivite_id,
                        (select count(*
                                )
                         from fiche_action x
                         where x.collectivite_id = c.collectivite_id) as fiches,
                        (select count(*
                                )
                         from axe x
                         where x.collectivite_id = c.collectivite_id
                           and x.parent is null)                      as plans,
                        (select count(*
                                )
                         from indicateur_resultat x
                         where x.collectivite_id = c.collectivite_id) as resultats_indicateurs,
                        (select count(*
                                )
                         from indicateur_personnalise_definition x
                         where x.collectivite_id = c.collectivite_id) as indicateurs_perso,
                        (select count(*
                                )
                         from indicateur_personnalise_resultat x
                         where x.collectivite_id = c.collectivite_id) as resultats_indicateurs_perso
                 from stats.collectivite c)
select collectivite_id,
       nom || ' (' || collectivite_id || ')' as key,
       completude_eci,
       completude_cae,
       x.fiches,
       x.plans,
       x.resultats_indicateurs,
       x.indicateurs_perso,
       x.resultats_indicateurs_perso,
       pr.date                               as premier_rattachement,
       (select count(*)
        from fiche_action f
        where f.collectivite_id = c.collectivite_id
          and f.titre is not null
          and (f.description is not null or f.objectifs is not null)) as fiches_initiees,
       (select count(*)
        from fiche_action f
        where f.collectivite_id = c.collectivite_id
          and (f.statut is not null
            or f.niveau_priorite is not null
            or f.date_debut is not null
            or f.date_fin_provisoire is not null
            or f.id in (select fiche_id from fiche_action_structure_tag)
            or f.id in (select fiche_id from fiche_action_pilote st)
            or f.id in (select fiche_id from fiche_action_service_tag)
            ))                                                        as fiches_pilotage,
       (select count(*)
        from fiche_action f
        where f.collectivite_id = c.collectivite_id
          and f.id in (select fiche_id from fiche_action_indicateur)) as fiches_indicateur,
       (select count(*)
        from fiche_action f
        where f.collectivite_id = c.collectivite_id
          and f.id in (select fiche_id from fiche_action_action))     as fiches_action_referentiel,
       (select count(*)
        from fiche_action f
        where f.collectivite_id = c.collectivite_id
          and f.id in (select fiche_id from fiches_liees_par_fiche))  as fiches_fiche_liee,
       (select count(*)
        from fiche_action f
        where f.collectivite_id = c.collectivite_id
          and f.modified_at > current_timestamp - interval '1 month')  as fiches_mod_1mois,
       (select count(*)
        from fiche_action f
        where f.collectivite_id = c.collectivite_id
          and f.modified_at > current_timestamp - interval '3 month')  as fiches_mod_3mois,
       (select count(*)
        from fiche_action f
        where f.collectivite_id = c.collectivite_id
          and f.modified_at > current_timestamp - interval '6 month')  as fiches_mod_6mois
from stats.collectivite c
         join stats.collectivite_active using (collectivite_id)
         left join comptes x using (collectivite_id)
         left join stats.pourcentage_completude pc using (collectivite_id)
         left join premier_rattachements pr using (collectivite_id)
order by c.nom;

create view crm_usages
as
select *
from stats.crm_usages
where is_service_role();

COMMIT;
