-- Deploy tet:retool/usage to pg

BEGIN;

drop materialized view public.retool_stats_usages;

create materialized view stats.retool_stats_usages as
with collectivites as (select cc.collectivite_id,
                              cc.code_siren_insee,
                              cc.nom,
                              cc.region_code,
                              cc.departement_code,
                              ir.libelle                                  as region_name,
                              id.libelle                                  as departement_name,
                              cc.type_collectivite,
                              epci.nature                                 as nature_collectivite,
                              (cot is not null)                           as cot,
                              (cc.completude_cae * 100)::double precision as completude_cae,
                              (cc.completude_eci * 100)::double precision as completude_eci,
                              cc.population                               as population_totale
                       from collectivite_card cc
                                left join imports.region ir on cc.region_code = ir.code
                                left join imports.departement id on cc.departement_code = id.code
                                left join epci using (collectivite_id)
                                left join cot using (collectivite_id)),
     activation as (select c.collectivite_id, min(pud.created_at) as date_activation
                    from collectivites c
                             left join private_utilisateur_droit pud on c.collectivite_id = pud.collectivite_id
                    group by c.collectivite_id),
     admin as (select pud.user_id,
                      pc.fonction,
                      pc.details_fonction,
                      pc.champ_intervention,
                      pud.collectivite_id,
                      dcp.email,
                      dcp.telephone,
                      dcp.prenom,
                      dcp.nom,
                      au.last_sign_in_at
               from private_utilisateur_droit pud
                        left join private_collectivite_membre pc
                                  on pud.user_id = pc.user_id and pud.collectivite_id = pc.collectivite_id
                        join dcp on pud.user_id = dcp.user_id
                        join auth.users au on pud.user_id = au.id
               where pud.niveau_acces = 'admin'
               order by case
                            when pc.fonction = 'referent' then 1
                            when pc.fonction = 'conseiller' then 2
                            else 3 end,
                        au.last_sign_in_at desc),
     admins as (select collectivites.collectivite_id,
                       pcm_1.prenom              as admin_prenom_1,
                       pcm_1.nom                 as admin_nom_1,
                       pcm_1.fonction            as admin_fonction_1,
                       pcm_1.details_fonction    as admin_detail_fonction_1,
                       pcm_1.champ_intervention  as admin_champs_intervention_1,
                       pcm_1.email               as admin_email_1,
                       pcm_1.telephone           as admin_telephone_1,
                       pcm_1.last_sign_in_at     as admin_derniere_connexion_1,
                       pcm_2.prenom              as admin_prenom_2,
                       pcm_2.nom                 as admin_nom_2,
                       pcm_2.fonction            as admin_fonction_2,
                       pcm_2.details_fonction    as admin_detail_fonction_2,
                       pcm_2.champ_intervention  as admin_champs_intervention_2,
                       pcm_2.email               as admin_email_2,
                       pcm_2.telephone           as admin_telephone_2,
                       pcm_2.last_sign_in_at     as admin_derniere_connexion_2,
                       pcm_3.prenom              as admin_prenom_3,
                       pcm_3.nom                 as admin_nom_3,
                       pcm_3.fonction            as admin_fonction_3,
                       pcm_3.details_fonction    as admin_detail_fonction_3,
                       pcm_3.champ_intervention  as admin_champs_intervention_3,
                       pcm_3.email               as admin_email_3,
                       pcm_3.telephone           as admin_telephone_3,
                       pcm_3.last_sign_in_at     as admin_derniere_connexion_3,
                       pcm_4.prenom              as admin_prenom_4,
                       pcm_4.nom                 as admin_nom_4,
                       pcm_4.fonction            as admin_fonction_4,
                       pcm_4.details_fonction    as admin_detail_fonction_4,
                       pcm_4.champ_intervention  as admin_champs_intervention_4,
                       pcm_4.email               as admin_email_4,
                       pcm_4.telephone           as admin_telephone_4,
                       pcm_4.last_sign_in_at     as admin_derniere_connexion_4,
                       pcm_5.prenom              as admin_prenom_5,
                       pcm_5.nom                 as admin_nom_5,
                       pcm_5.fonction            as admin_fonction_5,
                       pcm_5.details_fonction    as admin_detail_fonction_5,
                       pcm_5.champ_intervention  as admin_champs_intervention_5,
                       pcm_5.email               as admin_email_5,
                       pcm_5.telephone           as admin_telephone_5,
                       pcm_5.last_sign_in_at     as admin_derniere_connexion_5,
                       pcm_6.prenom              as admin_prenom_6,
                       pcm_6.nom                 as admin_nom_6,
                       pcm_6.fonction            as admin_fonction_6,
                       pcm_6.details_fonction    as admin_detail_fonction_6,
                       pcm_6.champ_intervention  as admin_champs_intervention_6,
                       pcm_6.email               as admin_email_6,
                       pcm_6.telephone           as admin_telephone_6,
                       pcm_6.last_sign_in_at     as admin_derniere_connexion_6,
                       pcm_7.prenom              as admin_prenom_7,
                       pcm_7.nom                 as admin_nom_7,
                       pcm_7.fonction            as admin_fonction_7,
                       pcm_7.details_fonction    as admin_detail_fonction_7,
                       pcm_7.champ_intervention  as admin_champs_intervention_7,
                       pcm_7.email               as admin_email_7,
                       pcm_7.telephone           as admin_telephone_7,
                       pcm_7.last_sign_in_at     as admin_derniere_connexion_7,
                       pcm_8.prenom              as admin_prenom_8,
                       pcm_8.nom                 as admin_nom_8,
                       pcm_8.fonction            as admin_fonction_8,
                       pcm_8.details_fonction    as admin_detail_fonction_8,
                       pcm_8.champ_intervention  as admin_champs_intervention_8,
                       pcm_8.email               as admin_email_8,
                       pcm_8.telephone           as admin_telephone_8,
                       pcm_8.last_sign_in_at     as admin_derniere_connexion_8,
                       pcm_9.prenom              as admin_prenom_9,
                       pcm_9.nom                 as admin_nom_9,
                       pcm_9.fonction            as admin_fonction_9,
                       pcm_9.details_fonction    as admin_detail_fonction_9,
                       pcm_9.champ_intervention  as admin_champs_intervention_9,
                       pcm_9.email               as admin_email_9,
                       pcm_9.telephone           as admin_telephone_9,
                       pcm_9.last_sign_in_at     as admin_derniere_connexion_9,
                       pcm_10.prenom             as admin_prenom_10,
                       pcm_10.nom                as admin_nom_10,
                       pcm_10.fonction           as admin_fonction_10,
                       pcm_10.details_fonction   as admin_detail_fonction_10,
                       pcm_10.champ_intervention as admin_champs_intervention_10,
                       pcm_10.email              as admin_email_10,
                       pcm_10.telephone          as admin_telephone_10,
                       pcm_10.last_sign_in_at    as admin_derniere_connexion_10
                from collectivites
                         left join lateral (select *
                                            from admin
                                            where admin.collectivite_id = collectivites.collectivite_id
                                            limit 1 ) pcm_1 on true
                         left join lateral (select *
                                            from admin
                                            where admin.collectivite_id = collectivites.collectivite_id
                                            limit 1 offset 1) pcm_2 on true
                         left join lateral (select *
                                            from admin
                                            where admin.collectivite_id = collectivites.collectivite_id
                                            limit 1 offset 2) pcm_3 on true
                         left join lateral (select *
                                            from admin
                                            where admin.collectivite_id = collectivites.collectivite_id
                                            limit 1 offset 3) pcm_4 on true
                         left join lateral (select *
                                            from admin
                                            where admin.collectivite_id = collectivites.collectivite_id
                                            limit 1 offset 4) pcm_5 on true
                         left join lateral (select *
                                            from admin
                                            where admin.collectivite_id = collectivites.collectivite_id
                                            limit 1 offset 5) pcm_6 on true
                         left join lateral (select *
                                            from admin
                                            where admin.collectivite_id = collectivites.collectivite_id
                                            limit 1 offset 6) pcm_7 on true
                         left join lateral (select *
                                            from admin
                                            where admin.collectivite_id = collectivites.collectivite_id
                                            limit 1 offset 7) pcm_8 on true
                         left join lateral (select *
                                            from admin
                                            where admin.collectivite_id = collectivites.collectivite_id
                                            limit 1 offset 8) pcm_9 on true
                         left join lateral (select *
                                            from admin
                                            where admin.collectivite_id = collectivites.collectivite_id
                                            limit 1 offset 9) pcm_10 on true),
     courant as (select collectivite_id,
                        action_id,
                        case
                            when point_potentiel = 0::double precision then 0::double precision
                            else point_fait / point_potentiel * 100::double precision
                            end as realise,
                        case
                            when point_potentiel = 0::double precision then 0::double precision
                            else point_programme / point_potentiel * 100::double precision
                            end as programme
                 from private.action_scores
                 where action_id = 'eci'
                    or action_id = 'cae'),
     courant_eci as (select * from courant where action_id = 'eci'),
     courant_cae as (select * from courant where action_id = 'cae'),
     label as (select l.collectivite_id,
                      l.etoiles,
                      l.score_realise::double precision   as score_realise,
                      l.score_programme::double precision as score_programme,
                      l.referentiel,
                      l.annee
               from labellisation l
                        join (select collectivite_id, referentiel, max(annee) AS annee
                              from labellisation
                              group by collectivite_id, referentiel) lmax on l.collectivite_id = lmax.collectivite_id
                   and l.referentiel = lmax.referentiel
                   and l.annee = lmax.annee),
     label_eci as (select collectivites.collectivite_id, l.etoiles, l.score_realise, l.score_programme, l.referentiel
                   from collectivites
                            left join (select * from label where referentiel = 'eci') l
                                      using (collectivite_id)),
     label_cae as (select collectivites.collectivite_id, l.etoiles, l.score_realise, l.score_programme, l.referentiel
                   from collectivites
                            left join (select * from label where referentiel = 'cae') l
                                      using (collectivite_id)),
     droits as (select collectivite_id, id, niveau_acces
                from private_utilisateur_droit
                where active = true),
     stats_droits as (select collectivite_id,
                             count(distinct pud)                    as nb_users_actifs,
                             count(distinct (case
                                                 when pud.niveau_acces = 'admin'::niveau_acces
                                                     then pud end)) as nb_admin,
                             count(distinct (case
                                                 when pud.niveau_acces = 'edition'::niveau_acces
                                                     then pud end)) as nb_ecriture,
                             count(distinct (case
                                                 when pud.niveau_acces = 'lecture'::niveau_acces
                                                     then pud end)) as nb_lecture
                      from droits pud
                      group by collectivite_id),
     fiches as (select collectivite_id, count(*) as nb_fiches from fiche_action group by collectivite_id),
     plans as (select collectivite_id, count(*) as nb_plans from axe where parent is null group by collectivite_id),
     indicateur_resultats as (select collectivite_id, count(*) as nb_valeurs_indicateurs
                              from indicateur_resultat
                              group by collectivite_id),
     indicateurs as (select collectivite_id,
                            count(distinct id)                    as nb_indicateurs,
                            count(distinct (case
                                                when id.indicateur_group = 'cae'::indicateur_group
                                                    then id end)) as nb_indicateurs_cae,
                            count(distinct (case
                                                when id.indicateur_group = 'eci'::indicateur_group
                                                    then id end)) as nb_indicateurs_eci
                     from indicateur_resultat ir
                              left join indicateur_definition id on ir.indicateur_id = id.id
                     group by collectivite_id),
     indicateurs_personnalises as (select collectivite_id, count(*) as nb_indicateurs_personnalises
                                   from indicateur_personnalise_definition
                                   group by collectivite_id)
select cc.collectivite_id,
       cc.code_siren_insee,
       cc.nom,
       cc.region_name,
       cc.region_code,
       cc.departement_name,
       cc.departement_code,
       cc.type_collectivite,
       cc.nature_collectivite,
       cc.population_totale,
       cc.cot,
       lcae.etoiles         as niveau_label_cae,
       lcae.score_realise   as realise_label_cae,
       lcae.score_programme as programme_label_cae,
       cc.completude_cae,
       ccae.realise         as realise_courant_cae,
       ccae.programme       as programme_courant_cae,
       leci.etoiles         as niveau_label_eci,
       leci.score_realise   as realise_label_eci,
       leci.score_programme as programme_label_eci,
       cc.completude_eci,
       ceci.realise         as realise_courant_eci,
       ceci.programme       as programme_courant_eci,
       pa.nb_plans,
       fa.nb_fiches,
       indicateurs.nb_indicateurs,
       indicateurs.nb_indicateurs_cae,
       indicateurs.nb_indicateurs_eci,
       indicateur_resultats.nb_valeurs_indicateurs,
       ipd.nb_indicateurs_personnalises,
       stats_droits.nb_users_actifs,
       stats_droits.nb_admin,
       stats_droits.nb_ecriture,
       stats_droits.nb_lecture,
       activation.date_activation,
       admins.admin_prenom_1,
       admins.admin_nom_1,
       admins.admin_fonction_1,
       admins.admin_detail_fonction_1,
       admins.admin_champs_intervention_1,
       admins.admin_email_1,
       admins.admin_telephone_1,
       admins.admin_derniere_connexion_1,
       admins.admin_prenom_2,
       admins.admin_nom_2,
       admins.admin_fonction_2,
       admins.admin_detail_fonction_2,
       admins.admin_champs_intervention_2,
       admins.admin_email_2,
       admins.admin_telephone_2,
       admins.admin_derniere_connexion_2,
       admins.admin_prenom_3,
       admins.admin_nom_3,
       admins.admin_fonction_3,
       admins.admin_detail_fonction_3,
       admins.admin_champs_intervention_3,
       admins.admin_email_3,
       admins.admin_telephone_3,
       admins.admin_derniere_connexion_3,
       admins.admin_prenom_4,
       admins.admin_nom_4,
       admins.admin_fonction_4,
       admins.admin_detail_fonction_4,
       admins.admin_champs_intervention_4,
       admins.admin_email_4,
       admins.admin_telephone_4,
       admins.admin_derniere_connexion_4,
       admins.admin_prenom_5,
       admins.admin_nom_5,
       admins.admin_fonction_5,
       admins.admin_detail_fonction_5,
       admins.admin_champs_intervention_5,
       admins.admin_email_5,
       admins.admin_telephone_5,
       admins.admin_derniere_connexion_5,
       admins.admin_prenom_6,
       admins.admin_nom_6,
       admins.admin_fonction_6,
       admins.admin_detail_fonction_6,
       admins.admin_champs_intervention_6,
       admins.admin_email_6,
       admins.admin_telephone_6,
       admins.admin_derniere_connexion_6,
       admins.admin_prenom_7,
       admins.admin_nom_7,
       admins.admin_fonction_7,
       admins.admin_detail_fonction_7,
       admins.admin_champs_intervention_7,
       admins.admin_email_7,
       admins.admin_telephone_7,
       admins.admin_derniere_connexion_7,
       admins.admin_prenom_8,
       admins.admin_nom_8,
       admins.admin_fonction_8,
       admins.admin_detail_fonction_8,
       admins.admin_champs_intervention_8,
       admins.admin_email_8,
       admins.admin_telephone_8,
       admins.admin_derniere_connexion_8,
       admins.admin_prenom_9,
       admins.admin_nom_9,
       admins.admin_fonction_9,
       admins.admin_detail_fonction_9,
       admins.admin_champs_intervention_9,
       admins.admin_email_9,
       admins.admin_telephone_9,
       admins.admin_derniere_connexion_9,
       admins.admin_prenom_10,
       admins.admin_nom_10,
       admins.admin_fonction_10,
       admins.admin_detail_fonction_10,
       admins.admin_champs_intervention_10,
       admins.admin_email_10,
       admins.admin_telephone_10,
       admins.admin_derniere_connexion_10
from collectivites cc
         left join fiches fa using (collectivite_id)
         left join plans pa using (collectivite_id)
         left join indicateur_resultats using (collectivite_id)
         left join indicateurs using (collectivite_id)
         left join indicateurs_personnalises ipd using (collectivite_id)
         left join label_eci leci using (collectivite_id)
         left join label_cae lcae using (collectivite_id)
         left join courant_eci ceci using (collectivite_id)
         left join courant_cae ccae using (collectivite_id)
         left join admins using (collectivite_id)
         left join stats_droits using (collectivite_id)
         left join activation using (collectivite_id)
order by collectivite_id;

create view public.retool_stats_usages
as
select *
from stats.retool_stats_usages
where is_service_role(); -- protège les DCPs.

COMMIT;
