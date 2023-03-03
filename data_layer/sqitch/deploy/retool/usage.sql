-- Deploy tet:retool/usage to pg

BEGIN;

create view retool_stats_usages as
with
    collectivites as (select cc.collectivite_id, cc.code_siren_insee, cc.nom, cc.region_code, cc.departement_code,
                             ir.libelle as region_name, id.libelle as departement_name, cc.type_collectivite,
                             epci.nature as nature_collectivite, (cot is not null) as cot,
                             cc.completude_cae * 100 as completude_cae,
                             cc.completude_eci * 100 as completude_eci,
                             cc.population as population_totale
                      from collectivite_card cc
                               left join imports.region ir on cc.region_code = ir.code
                               left join imports.departement id on cc.departement_code = id.code
                               left join epci using (collectivite_id)
                               left join cot using (collectivite_id)),
    admin as (select pc.user_id, pc.fonction, pc.details_fonction, pc.champ_intervention,
                     private_utilisateur_droit.collectivite_id,
                     dcp.email, dcp.telephone, dcp.prenom, dcp.nom, au.last_sign_in_at
              from private_utilisateur_droit
                       left join private_collectivite_membre pc using(user_id)
                       join dcp using (user_id)
                       join auth.users au on dcp.user_id = au.id
              where private_utilisateur_droit.niveau_acces = 'admin'
              order by last_sign_in_at desc),
    admins as (select collectivites.collectivite_id,
                      pcm_1.prenom as admin_prenom_1,
                      pcm_1.nom as admin_nom_1,
                      pcm_1.fonction as admin_fonction_1,
                      pcm_1.details_fonction as admin_detail_fonction_1,
                      pcm_1.champ_intervention as admin_champs_intervention_1,
                      pcm_1.email as admin_email_1,
                      pcm_1.telephone as admin_telephone_1,
                      pcm_1.last_sign_in_at as admin_derniere_connexion_1,
                      pcm_2.prenom as admin_prenom_2,
                      pcm_2.nom as admin_nom_2,
                      pcm_2.fonction as admin_fonction_2,
                      pcm_2.details_fonction as admin_detail_fonction_2,
                      pcm_2.champ_intervention as admin_champs_intervention_2,
                      pcm_2.email as admin_email_2,
                      pcm_2.telephone as admin_telephone_2,
                      pcm_2.last_sign_in_at as admin_derniere_connexion_2
               from collectivites
                        left join lateral (select * from admin where admin.collectivite_id = collectivites.collectivite_id limit 1 ) pcm_1 on true
                        left join lateral (select * from admin where admin.collectivite_id = collectivites.collectivite_id limit 1 offset 1) pcm_2 on true),
    courant as (select collectivite_id, action_id,
                       case when point_potentiel = 0::double precision then 0::double precision
                            else point_fait / point_potentiel * 100::double precision
                           end as realise,
                       case
                           when point_potentiel = 0::double precision then 0::double precision
                           else point_programme / point_potentiel * 100::double precision
                           end as programme
                from private.action_scores),
    courant_eci as (select * from courant where action_id = 'eci'),
    courant_cae as (select * from courant where action_id = 'cae'),
    label as (select collectivite_id, etoiles, score_realise, score_programme, referentiel from labellisation order by annee desc),
    label_eci as (select collectivites.collectivite_id, l.etoiles, l.score_realise, l.score_programme, l.referentiel
                  from collectivites
                           left join lateral (select * from label
                                              where collectivites.collectivite_id = label.collectivite_id
                                                and referentiel = 'eci' limit 1
                      ) l on true),
    label_cae as (select collectivites.collectivite_id, l.etoiles, l.score_realise, l.score_programme, l.referentiel
                  from collectivites
                           left join lateral (select * from label
                                              where collectivites.collectivite_id = label.collectivite_id
                                                and referentiel = 'cae' limit 1
                      ) l on true),
    droits as (select collectivite_id, id, niveau_acces
               from private_utilisateur_droit where active = true),
    stats_droits as (select collectivite_id,
                            count(distinct pud) as nb_users_actifs,
                            count(distinct (case when pud.niveau_acces = 'admin'::niveau_acces
                                                     then pud end)) as nb_admin,
                            count(distinct (case when pud.niveau_acces = 'edition'::niveau_acces
                                                     then pud end)) as nb_ecriture,
                            count(distinct (case when pud.niveau_acces = 'lecture'::niveau_acces
                                                     then pud end)) as nb_lecture
                     from droits pud group by collectivite_id),
    fiches as (select collectivite_id, count(*) as nb_fiches from fiche_action group by collectivite_id),
    plans as (select collectivite_id, count(*) as nb_plans from axe where parent is null group by collectivite_id),
    indicateur_resultats as (select collectivite_id, count(*) as nb_valeurs_indicateurs
                             from indicateur_resultat group by collectivite_id),
    indicateurs as (select collectivite_id,
                           count(distinct id) as nb_indicateurs,
                           count(distinct (case when id.indicateur_group = 'cae'::indicateur_group
                                                    then id end)) as nb_indicateurs_cae,
                           count(distinct (case when id.indicateur_group = 'eci'::indicateur_group
                                                    then id end)) as nb_indicateurs_eci
                    from indicateur_resultat ir
                             left join indicateur_definition id on ir.indicateur_id = id.id
                    group by collectivite_id),
    indicateurs_personnalises as (select collectivite_id, count(*) as nb_indicateurs_personnalises
                                  from indicateur_personnalise_definition group by collectivite_id)
select
    cc.collectivite_id,
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
    lcae.etoiles as niveau_label_cae,
    lcae.score_realise as realise_label_cae,
    lcae.score_programme as programme_label_cae,
    cc.completude_cae,
    ccae.realise as realise_courant_cae,
    ccae.programme as programme_courant_cae,
    leci.etoiles as niveau_label_eci,
    leci.score_realise as realise_label_eci,
    leci.score_programme as programme_label_eci,
    cc.completude_eci,
    ceci.realise  as realise_courant_eci,
    ceci.programme  as programme_courant_eci,
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
    admins.admin_derniere_connexion_2
from collectivites cc
         left join fiches fa using (collectivite_id)
         left join plans pa using (collectivite_id)
         left join indicateur_resultats using(collectivite_id)
         left join indicateurs using (collectivite_id)
         left join indicateurs_personnalises ipd using (collectivite_id)
         left join label_eci leci using (collectivite_id)
         left join label_cae lcae using (collectivite_id)
         left join courant_eci ceci using (collectivite_id)
         left join courant_cae ccae using (collectivite_id)
         left join admins using (collectivite_id)
         left join stats_droits using (collectivite_id)
where is_service_role(); -- Protect the DCPs.

COMMIT;
