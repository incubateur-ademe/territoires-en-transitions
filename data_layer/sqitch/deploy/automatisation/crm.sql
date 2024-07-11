-- Deploy tet:utils/automatisation to pg

BEGIN;

set statement_timeout to 3600000;

drop view public.crm_usages;
drop materialized view stats.crm_usages;

/*
 Définitions :
- Fiche action (FA) non vide = à minima le titre renseignée
- Fiche action pilotable = à minima le titre, le pilote et le statut renseigné
- Plan d'actions non vide = plan avec un titre et min. 5 FA avec à minima un titre
- Plan d'actions “pilotable” = min 5 FA avec à minima, le titre, le pilote et le statut renseigné
 */

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
          and f.modified_at > current_timestamp - interval '6 month')  as fiches_mod_6mois,
       (select min(f.created_at)
        from (select p.created_at, count(f) as nb_fiche
              from fiche_action f
                       join fiche_action_axe faa on f.id = faa.fiche_id
                       join axe a on a.id = faa.axe_id
                       join axe p on a.plan = p.id
              where f.collectivite_id = c.collectivite_id
                and (titre is not null or titre != 'Nouvelle fiche')
                and p.nom is not null
              group by p.id, p.created_at) f
        where f.nb_fiche>4) as PA_date_creation,
       (select count(*)
        from visite
        where page = 'plan'
          and collectivite_id = c.collectivite_id
          and time > (current_timestamp - interval '1 month')) as PA_view_1mois,
       (select count(*)
        from visite
        where page = 'plan'
          and collectivite_id = c.collectivite_id
          and time > (current_timestamp - interval '3 month')) as PA_view_3mois,
       (select count(*)
        from visite
        where page = 'plan'
          and collectivite_id = c.collectivite_id
          and time > (current_timestamp - interval '6 month')) as PA_view_6mois,
       (select count(*)
        from (select p.id, count(f) as nb_fiche
              from fiche_action f
                       join fiche_action_axe faa on f.id = faa.fiche_id
                       join axe a on a.id = faa.axe_id
                       join axe p on a.plan = p.id
              where f.collectivite_id = c.collectivite_id
                and (titre is not null or titre != 'Nouvelle fiche')
                and p.nom is not null
              group by p.id) f
        where f.nb_fiche>4) as PA_non_vides,
       (select count(*)
        from (select p.id, count(f) as nb_fiche
              from fiche_action f
                       join fiche_action_pilote fap on f.id = fap.fiche_id
                       join fiche_action_axe faa on f.id = faa.fiche_id
                       join axe a on a.id = faa.axe_id
                       join axe p on a.plan = p.id
              where f.collectivite_id = c.collectivite_id
                and (titre is not null or titre != 'Nouvelle fiche')
                and f.statut is not null
                and p.nom is not null
              group by p.id) f
        where f.nb_fiche>4) as PA_pilotables,
       (select count(*)
        from fiche_action f
        where f.collectivite_id = c.collectivite_id
          and (titre is not null or titre != 'Nouvelle fiche')) as fiches_non_vides,
       (select count(*)
        from fiche_action f
                 join fiche_action_pilote fap on f.id = fap.fiche_id
        where f.collectivite_id = c.collectivite_id
          and (titre is not null or titre != 'Nouvelle fiche')
          and f.statut is not null) as fiches_pilotables,
       (select count(*)>4
        from fiche_action f
                 left join fiche_action_pilote fap on f.id = fap.fiche_id
        where f.collectivite_id = c.collectivite_id
          and (titre is not null or titre != 'Nouvelle fiche')
          and (f.statut is not null
            or f.niveau_priorite is not null
            or f.date_fin_provisoire is not null
            or fap is not null)) as _5fiches_1pilotage,
       (select count(*)
        from historique.fiche_action f
        where f.collectivite_id = c.collectivite_id
          and (f.previous_statut != f.statut
            or (f.previous_statut is null and f.statut is not null)
            or (f.previous_statut is not null and f.statut is null))
          and f.modified_at > (current_timestamp - interval '6 month')
       ) as fiches_changement_statut,
       (case when x.fiches=0 then 0
             else
                 (((select count(*)
                    from fiche_action f
                    where f.collectivite_id = c.collectivite_id
                      and f.restreint = true
                   )::numeric /x.fiches::numeric) *100)
           end) as pourcentage_FA_privee,
       (case when x.fiches=0 then 0
             else
                 (((select count(*)
                    from fiche_action f
                             join fiche_action_pilote fap on f.id = fap.fiche_id
                    where f.collectivite_id = c.collectivite_id
                      and f.restreint = true
                      and (f.titre is not null or f.titre != 'Nouvelle fiche')
                      and f.statut is not null
                   )::numeric /x.fiches::numeric) *100)
           end) as pourcentage_FA_pilotable_privee,
       (
           select count(ic.*)
           from indicateur_confidentiel ic
           where ic.collectivite_id = c.collectivite_id
       ) as indicateur_prive,
       (
           select count(ic.*) > 0
           from indicateur_confidentiel ic
           where ic.collectivite_id = c.collectivite_id
       ) as min1_indicateur_prive,
       (
           select count(ic.*) > 0
           from indicateur_confidentiel ic
           where ic.collectivite_id = c.collectivite_id
             and ic.indicateur_id is not null
       ) as min1_indicateur_predef_prive,
       (
           select count(ic.*) > 0
           from indicateur_confidentiel ic
           where ic.collectivite_id = c.collectivite_id
             and ic.indicateur_perso_id is not null
       ) as min1_indicateur_perso_prive,
       (
           select i.pourcentage
           from (
                    select c.id as collectivite_id,
                          case when (
                            select count(*) from indicateur_definition)=0 then 0::double precision
                            else (count(ic)::double precision / (select count(*) from indicateur_definition)::double precision
                               * 100::double precision
                            ) end as pourcentage
                            from collectivite c
                             left join indicateur_confidentiel ic on ic.collectivite_id = c.id
                        and ic.indicateur_id is not null
                    group by c.id
                ) i
           where i.collectivite_id = c.collectivite_id
       ) as pourcentage_indicateur_predef_prives,
       (select array_agg(distinct pat.type)
        from (select p.id, count(f) as nb_fiche
              from fiche_action f
                       join fiche_action_pilote fap on f.id = fap.fiche_id
                       join fiche_action_axe faa on f.id = faa.fiche_id
                       join axe a on a.id = faa.axe_id
                       join axe p on a.plan = p.id
              where f.collectivite_id = c.collectivite_id
                and (titre is not null or titre != 'Nouvelle fiche')
                and f.statut is not null
                and p.nom is not null
              group by p.id) f
                 join axe a on f.id = a.id
                 left join plan_action_type pat on a.type = pat.id
        where f.nb_fiche>4) as type_pa
from stats.collectivite c
         join stats.collectivite_active using (collectivite_id)
         left join comptes x using (collectivite_id)
         left join stats.pourcentage_completude pc using (collectivite_id)
         left join premier_rattachements pr using (collectivite_id)
order by c.nom;
comment on column stats.crm_usages.PA_date_creation is
    'Date de création du premier plan (avec +5 FA non vides) pour chaque collectivité concernées';
comment on column stats.crm_usages.PA_view_1mois is
    'Nombre de consultations de Plans d''action (tous plans confondus, non vides) au cours du mois dernier';
comment on column stats.crm_usages.PA_view_3mois is
    'Nombre de consultations de Plans d''action (tous plans confondus, non vides) au cours des 3 derniers mois';
comment on column stats.crm_usages.PA_view_6mois is
    'Nombre de consultations de Plans d''action (tous plans confondus, non vides) au cours des 6 derniers mois.';
comment on column stats.crm_usages.PA_non_vides is
    'Nombre de plans non vides (minimum un titre de PA et 5 FA non vides)';
comment on column stats.crm_usages.PA_pilotables is
    'Nombre de plans “pilotables” (= avec min. 5 FA, qui ont à minima, le titre, le pilote et le statut renseigné)';
comment on column stats.crm_usages.fiches_non_vides is
    'Nombre de fiches actions non vides';
comment on column stats.crm_usages.fiches_pilotables is
    'Nombre de fiches actions pilotables ( = à minima le titre, le pilote et le statut renseigné)';
comment on column stats.crm_usages._5fiches_1pilotage is
    'Nombre de collectivités qui ont au moins 5 FA avec au moins le titre + 1 critère de pilotage renseigné (soit statut ou priorité ou date prévisionnelle ou responsable)';
comment on column stats.crm_usages.fiches_changement_statut is
    'Nombre de changements de statut de fiches actions dans les 6 derniers mois par collectivité (tous les status)';
comment on column stats.crm_usages.pourcentage_FA_privee is
    '% de fiches action privées par collectivité';
comment on column stats.crm_usages.pourcentage_FA_pilotable_privee is
    '% de fiches action pilotables privées (avec au moins un titre rempli, le pilote et le statut)';
comment on column stats.crm_usages.indicateur_prive is
    'Nombre d''indicateurs privés par collectivité';
comment on column stats.crm_usages.min1_indicateur_prive is
    'Vrai si au moins un indicateur privé';
comment on column stats.crm_usages.min1_indicateur_predef_prive is
    'Vrai si au moins un indicateur prédéfini privé';
comment on column stats.crm_usages.min1_indicateur_perso_prive is
    'Vrai si au moins un indicateur perso privé';
comment on column stats.crm_usages.pourcentage_indicateur_predef_prives is
    '% d''indicateur prédéfini privé par collectivité';
comment on column stats.crm_usages.type_pa is
    'Liste de tous les types des plans pilotables de la collectivité';



create view crm_usages
as
select *
from stats.crm_usages
where is_service_role();

create materialized view stats.crm_indicateurs
as
select i.id,
       id.nom,
       i.nb_prive,
       (
           ( i.nb_prive::double precision / (select count(*) from indicateur_definition)::double precision)
               *100::double precision) as pourcentage_prive
from (
         select id.id, count (ic) as nb_prive
         from indicateur_definition id
                  left join indicateur_confidentiel ic on id.id = ic.indicateur_id
         group by id.id
     ) i
         join indicateur_definition id on i.id = id.id
order by i.nb_prive desc;

create view crm_indicateurs
as
select *
from stats.crm_indicateurs
where is_service_role();

create materialized view stats.crm_plans as
select pat.type,
       (select count(*) from axe p where p.id = p.plan and (p.type = pat.id or (p.type is null and pat.id is null ))) as nb_plan,
       count(f.*) as nb_plan_90pc_FA_privees
from (select pat.id, pat.type from plan_action_type pat union select null as id, null as type) pat
         left join axe p on pat.id = p.type or (p.type is null and p.id = p.plan)
         left join (select p.id, count(f) as nb_fiche, count(f) FILTER ( WHERE f.restreint ) as nb_fiche_restreinte
                    from fiche_action f
                             join fiche_action_axe faa on f.id = faa.fiche_id
                             join axe a on a.id = faa.axe_id
                             join axe p on a.plan = p.id
                    group by p.id) f on p.id = f.id
    and (f.nb_fiche_restreinte::double precision /
         f.nb_fiche::double precision *
         100::double precision)>=90
group by pat.id, pat.type;

create view crm_plans as
select *
from stats.crm_plans
where is_service_role();

COMMIT;
