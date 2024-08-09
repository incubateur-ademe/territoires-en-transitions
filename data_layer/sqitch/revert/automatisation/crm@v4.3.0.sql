-- Deploy tet:utils/automatisation to pg

BEGIN;

set statement_timeout to 3600000;

drop view public.crm_usages;
drop materialized view stats.crm_usages;

create materialized view stats.crm_usages as
WITH premier_rattachements AS (
                              SELECT private_utilisateur_droit.collectivite_id,
                                     min(private_utilisateur_droit.created_at)::date AS date
                              FROM private_utilisateur_droit
                              WHERE private_utilisateur_droit.active
                              GROUP BY private_utilisateur_droit.collectivite_id
                              ),
     comptes AS (
                              SELECT c_1.collectivite_id,
                                     (
                                     SELECT count(*) AS count
                                     FROM fiche_action x_1
                                     WHERE x_1.collectivite_id = c_1.collectivite_id
                                     ) AS fiches,
                                     (
                                     SELECT count(*) AS count
                                     FROM axe x_1
                                     WHERE x_1.collectivite_id = c_1.collectivite_id
                                       AND x_1.parent IS NULL
                                     ) AS plans,
                                     (
                                     SELECT count(*) AS count
                                     FROM indicateur_valeur x_1
                                     JOIN indicateur_definition id on x_1.indicateur_id = id.id
                                     WHERE x_1.collectivite_id = c_1.collectivite_id
                                       AND x_1.resultat is not null
                                       AND id.collectivite_id is null
                                     ) AS resultats_indicateurs,
                                     (
                                     SELECT count(*) AS count
                                     FROM indicateur_definition x_1
                                     WHERE x_1.collectivite_id is not null
                                       AND x_1.collectivite_id = c_1.collectivite_id
                                     ) AS indicateurs_perso,
                                     (
                                     SELECT count(*) AS count
                                     FROM indicateur_valeur x_1
                                     JOIN indicateur_definition id on x_1.indicateur_id = id.id
                                     WHERE x_1.collectivite_id = c_1.collectivite_id
                                       AND x_1.resultat is not null
                                       AND id.collectivite_id is not null
                                     ) AS resultats_indicateurs_perso
                              FROM stats.collectivite c_1
                              )
SELECT c.collectivite_id,
       ((c.nom::text || ' ('::text) || c.collectivite_id) || ')'::text AS key,
       pc.completude_eci,
       pc.completude_cae,
       x.fiches,
       x.plans,
       x.resultats_indicateurs,
       x.indicateurs_perso,
       x.resultats_indicateurs_perso,
       pr.date                                                         AS premier_rattachement,
       (
       SELECT count(*) AS count
       FROM fiche_action f
       WHERE f.collectivite_id = c.collectivite_id
         AND f.titre IS NOT NULL
         AND (f.description IS NOT NULL OR f.objectifs IS NOT NULL)
       )                                                               AS fiches_initiees,
       (
       SELECT count(*) AS count
       FROM fiche_action f
       WHERE f.collectivite_id = c.collectivite_id
         AND (f.statut IS NOT NULL OR f.niveau_priorite IS NOT NULL OR f.date_debut IS NOT NULL OR
              f.date_fin_provisoire IS NOT NULL OR (f.id IN (
                                                            SELECT fiche_action_structure_tag.fiche_id
                                                            FROM fiche_action_structure_tag
                                                            )) OR (f.id IN (
                                                                           SELECT st.fiche_id
                                                                           FROM fiche_action_pilote st
                                                                           )) OR (f.id IN (
                                                                                          SELECT fiche_action_service_tag.fiche_id
                                                                                          FROM fiche_action_service_tag
                                                                                          )))
       )                                                               AS fiches_pilotage,
       (
       SELECT count(*) AS count
       FROM fiche_action f
       WHERE f.collectivite_id = c.collectivite_id
         AND (f.id IN (
                      SELECT fiche_action_indicateur.fiche_id
                      FROM fiche_action_indicateur
                      ))
       )                                                               AS fiches_indicateur,
       (
       SELECT count(*) AS count
       FROM fiche_action f
       WHERE f.collectivite_id = c.collectivite_id
         AND (f.id IN (
                      SELECT fiche_action_action.fiche_id
                      FROM fiche_action_action
                      ))
       )                                                               AS fiches_action_referentiel,
       (
       SELECT count(*) AS count
       FROM fiche_action f
       WHERE f.collectivite_id = c.collectivite_id
         AND (f.id IN (
                      SELECT fiches_liees_par_fiche.fiche_id
                      FROM fiches_liees_par_fiche
                      ))
       )                                                               AS fiches_fiche_liee,
       (
       SELECT count(*) AS count
       FROM fiche_action f
       WHERE f.collectivite_id = c.collectivite_id
         AND f.modified_at > (CURRENT_TIMESTAMP - '1 mon'::interval)
       )                                                               AS fiches_mod_1mois,
       (
       SELECT count(*) AS count
       FROM fiche_action f
       WHERE f.collectivite_id = c.collectivite_id
         AND f.modified_at > (CURRENT_TIMESTAMP - '3 mons'::interval)
       )                                                               AS fiches_mod_3mois,
       (
       SELECT count(*) AS count
       FROM fiche_action f
       WHERE f.collectivite_id = c.collectivite_id
         AND f.modified_at > (CURRENT_TIMESTAMP - '6 mons'::interval)
       )                                                               AS fiches_mod_6mois,
       (
       SELECT min(f.created_at) AS min
       FROM (
            SELECT p.created_at,
                   count(f_1.*) AS nb_fiche
            FROM fiche_action f_1
            JOIN fiche_action_axe faa ON f_1.id = faa.fiche_id
            JOIN axe a ON a.id = faa.axe_id
            JOIN axe p ON a.plan = p.id
            WHERE f_1.collectivite_id = c.collectivite_id
              AND (f_1.titre IS NOT NULL OR f_1.titre::text <> 'Nouvelle fiche'::text)
              AND p.nom IS NOT NULL
            GROUP BY p.id, p.created_at
            ) f
       WHERE f.nb_fiche > 4
       )                                                               AS pa_date_creation,
       (
       SELECT count(*) AS count
       FROM visite
       WHERE visite.page = 'plan'::visite_page
         AND visite.collectivite_id = c.collectivite_id
         AND visite."time" > (CURRENT_TIMESTAMP - '1 mon'::interval)
       )                                                               AS pa_view_1mois,
       (
       SELECT count(*) AS count
       FROM visite
       WHERE visite.page = 'plan'::visite_page
         AND visite.collectivite_id = c.collectivite_id
         AND visite."time" > (CURRENT_TIMESTAMP - '3 mons'::interval)
       )                                                               AS pa_view_3mois,
       (
       SELECT count(*) AS count
       FROM visite
       WHERE visite.page = 'plan'::visite_page
         AND visite.collectivite_id = c.collectivite_id
         AND visite."time" > (CURRENT_TIMESTAMP - '6 mons'::interval)
       )                                                               AS pa_view_6mois,
       (
       SELECT count(*) AS count
       FROM (
            SELECT p.id,
                   count(f_1.*) AS nb_fiche
            FROM fiche_action f_1
            JOIN fiche_action_axe faa ON f_1.id = faa.fiche_id
            JOIN axe a ON a.id = faa.axe_id
            JOIN axe p ON a.plan = p.id
            WHERE f_1.collectivite_id = c.collectivite_id
              AND (f_1.titre IS NOT NULL OR f_1.titre::text <> 'Nouvelle fiche'::text)
              AND p.nom IS NOT NULL
            GROUP BY p.id
            ) f
       WHERE f.nb_fiche > 4
       )                                                               AS pa_non_vides,
       (
       SELECT count(*) AS count
       FROM (
            SELECT p.id,
                   count(f_1.*) AS nb_fiche
            FROM fiche_action f_1
            JOIN fiche_action_pilote fap ON f_1.id = fap.fiche_id
            JOIN fiche_action_axe faa ON f_1.id = faa.fiche_id
            JOIN axe a ON a.id = faa.axe_id
            JOIN axe p ON a.plan = p.id
            WHERE f_1.collectivite_id = c.collectivite_id
              AND (f_1.titre IS NOT NULL OR f_1.titre::text <> 'Nouvelle fiche'::text)
              AND f_1.statut IS NOT NULL
              AND p.nom IS NOT NULL
            GROUP BY p.id
            ) f
       WHERE f.nb_fiche > 4
       )                                                               AS pa_pilotables,
       (
       SELECT count(*) AS count
       FROM fiche_action f
       WHERE f.collectivite_id = c.collectivite_id
         AND (f.titre IS NOT NULL OR f.titre::text <> 'Nouvelle fiche'::text)
       )                                                               AS fiches_non_vides,
       (
       SELECT count(*) AS count
       FROM fiche_action f
       JOIN fiche_action_pilote fap ON f.id = fap.fiche_id
       WHERE f.collectivite_id = c.collectivite_id
         AND (f.titre IS NOT NULL OR f.titre::text <> 'Nouvelle fiche'::text)
         AND f.statut IS NOT NULL
       )                                                               AS fiches_pilotables,
       (
       SELECT count(*) > 4
       FROM fiche_action f
       LEFT JOIN fiche_action_pilote fap ON f.id = fap.fiche_id
       WHERE f.collectivite_id = c.collectivite_id
         AND (f.titre IS NOT NULL OR f.titre::text <> 'Nouvelle fiche'::text)
         AND (f.statut IS NOT NULL OR f.niveau_priorite IS NOT NULL OR f.date_fin_provisoire IS NOT NULL OR
              fap.* IS NOT NULL)
       )                                                               AS _5fiches_1pilotage,
       (
       SELECT count(*) AS count
       FROM historique.fiche_action f
       WHERE f.collectivite_id = c.collectivite_id
         AND (f.previous_statut <> f.statut OR f.previous_statut IS NULL AND f.statut IS NOT NULL OR
              f.previous_statut IS NOT NULL AND f.statut IS NULL)
         AND f.modified_at > (CURRENT_TIMESTAMP - '6 mons'::interval)
       )                                                               AS fiches_changement_statut,
       CASE
           WHEN x.fiches = 0 THEN 0::numeric
           ELSE ((
                 SELECT count(*) AS count
                 FROM fiche_action f
                 WHERE f.collectivite_id = c.collectivite_id
                   AND f.restreint = true
                 )
                )::numeric / x.fiches::numeric * 100::numeric
       END                                                             AS pourcentage_fa_privee,
       CASE
           WHEN x.fiches = 0 THEN 0::numeric
           ELSE ((
                 SELECT count(*) AS count
                 FROM fiche_action f
                 JOIN fiche_action_pilote fap ON f.id = fap.fiche_id
                 WHERE f.collectivite_id = c.collectivite_id
                   AND f.restreint = true
                   AND (f.titre IS NOT NULL OR f.titre::text <> 'Nouvelle fiche'::text)
                   AND f.statut IS NOT NULL
                 )
                )::numeric / x.fiches::numeric * 100::numeric
       END                                                             AS pourcentage_fa_pilotable_privee,
       (
       SELECT count(ic.*) AS count
       FROM indicateur_collectivite ic
       WHERE ic.collectivite_id = c.collectivite_id
         AND ic.confidentiel = true
       )                                                               AS indicateur_prive,
       (
       SELECT count(ic.*) > 0
       FROM indicateur_collectivite ic
       WHERE ic.collectivite_id = c.collectivite_id
         AND ic.confidentiel = true
       )                                                               AS min1_indicateur_prive,
       (
       SELECT count(ic.*) > 0
       FROM indicateur_collectivite ic
       JOIN indicateur_definition id on ic.indicateur_id = id.id
       WHERE ic.collectivite_id = c.collectivite_id
         AND id.collectivite_id is null
         AND ic.confidentiel = true
       )                                                               AS min1_indicateur_predef_prive,
       (
       SELECT count(ic.*) > 0
       FROM indicateur_collectivite ic
       JOIN indicateur_definition id on ic.indicateur_id = id.id
       WHERE ic.collectivite_id = c.collectivite_id
         AND id.collectivite_id is not null
         AND ic.confidentiel = true
       )                                                               AS min1_indicateur_perso_prive,
       (
       SELECT i.pourcentage
       FROM (
            SELECT c_1.id                                                                      AS collectivite_id,
                   case when ((
                              SELECT count(*) AS count
                              FROM indicateur_definition
                              WHERE collectivite_id is null
                              )
                             ) = 0 then 0::double precision
                       else
                   count(ic.*)::double precision / ((
                                                    SELECT count(*) AS count
                                                    FROM indicateur_definition
                                                    WHERE collectivite_id is null
                                                    )
                                                   )::double precision * 100::double precision
                       end AS pourcentage
            FROM collectivite c_1
            LEFT JOIN (select i.* from indicateur_collectivite i
            join indicateur_definition id on i.indicateur_id = id.id
                       where i.confidentiel = true
                         and id.collectivite_id is null) ic
                      ON ic.collectivite_id = c_1.id
            GROUP BY c_1.id
            ) i
       WHERE i.collectivite_id = c.collectivite_id
       )                                                               AS pourcentage_indicateur_predef_prives,
       (
       SELECT array_agg(DISTINCT pat.type) AS array_agg
       FROM (
            SELECT p.id,
                   count(f_1.*) AS nb_fiche
            FROM fiche_action f_1
            JOIN fiche_action_pilote fap ON f_1.id = fap.fiche_id
            JOIN fiche_action_axe faa ON f_1.id = faa.fiche_id
            JOIN axe a_1 ON a_1.id = faa.axe_id
            JOIN axe p ON a_1.plan = p.id
            WHERE f_1.collectivite_id = c.collectivite_id
              AND (f_1.titre IS NOT NULL OR f_1.titre::text <> 'Nouvelle fiche'::text)
              AND f_1.statut IS NOT NULL
              AND p.nom IS NOT NULL
            GROUP BY p.id
            ) f
       JOIN axe a ON f.id = a.id
       LEFT JOIN plan_action_type pat ON a.type = pat.id
       WHERE f.nb_fiche > 4
       )                                                               AS type_pa
FROM stats.collectivite c
JOIN stats.collectivite_active USING (collectivite_id)
LEFT JOIN comptes x USING (collectivite_id)
LEFT JOIN stats.pourcentage_completude pc USING (collectivite_id)
LEFT JOIN premier_rattachements pr USING (collectivite_id)
ORDER BY c.nom;
comment on column stats.crm_usages.pa_date_creation is 'Date de création du premier plan (avec +5 FA non vides) pour chaque collectivité concernées';
comment on column stats.crm_usages.pa_view_1mois is 'Nombre de consultations de Plans d''action (tous plans confondus, non vides) au cours du mois dernier';
comment on column stats.crm_usages.pa_view_3mois is 'Nombre de consultations de Plans d''action (tous plans confondus, non vides) au cours des 3 derniers mois';
comment on column stats.crm_usages.pa_view_6mois is 'Nombre de consultations de Plans d''action (tous plans confondus, non vides) au cours des 6 derniers mois.';
comment on column stats.crm_usages.pa_non_vides is 'Nombre de plans non vides (minimum un titre de PA et 5 FA non vides)';
comment on column stats.crm_usages.pa_pilotables is 'Nombre de plans “pilotables” (= avec min. 5 FA, qui ont à minima, le titre, le pilote et le statut renseigné)';
comment on column stats.crm_usages.fiches_non_vides is 'Nombre de fiches actions non vides';
comment on column stats.crm_usages.fiches_pilotables is 'Nombre de fiches actions pilotables ( = à minima le titre, le pilote et le statut renseigné)';
comment on column stats.crm_usages._5fiches_1pilotage is 'Nombre de collectivités qui ont au moins 5 FA avec au moins le titre + 1 critère de pilotage renseigné (soit statut ou priorité ou date prévisionnelle ou responsable)';
comment on column stats.crm_usages.fiches_changement_statut is 'Nombre de changements de statut de fiches actions dans les 6 derniers mois par collectivité (tous les status)';
comment on column stats.crm_usages.pourcentage_fa_privee is '% de fiches action privées par collectivité';
comment on column stats.crm_usages.pourcentage_fa_pilotable_privee is '% de fiches action pilotables privées (avec au moins un titre rempli, le pilote et le statut)';
comment on column stats.crm_usages.indicateur_prive is 'Nombre d''indicateurs privés par collectivité';
comment on column stats.crm_usages.min1_indicateur_prive is 'Vrai si au moins un indicateur privé';
comment on column stats.crm_usages.min1_indicateur_predef_prive is 'Vrai si au moins un indicateur prédéfini privé';
comment on column stats.crm_usages.min1_indicateur_perso_prive is 'Vrai si au moins un indicateur perso privé';
comment on column stats.crm_usages.pourcentage_indicateur_predef_prives is '% d''indicateur prédéfini privé par collectivité';
comment on column stats.crm_usages.type_pa is 'Liste de tous les types des plans pilotables de la collectivité';

-- public.crm_usages;
create view public.crm_usages as
SELECT crm_usages.collectivite_id,
       crm_usages.key,
       crm_usages.completude_eci,
       crm_usages.completude_cae,
       crm_usages.fiches,
       crm_usages.plans,
       crm_usages.resultats_indicateurs,
       crm_usages.indicateurs_perso,
       crm_usages.resultats_indicateurs_perso,
       crm_usages.premier_rattachement,
       crm_usages.fiches_initiees,
       crm_usages.fiches_pilotage,
       crm_usages.fiches_indicateur,
       crm_usages.fiches_action_referentiel,
       crm_usages.fiches_fiche_liee,
       crm_usages.fiches_mod_1mois,
       crm_usages.fiches_mod_3mois,
       crm_usages.fiches_mod_6mois,
       crm_usages.pa_date_creation,
       crm_usages.pa_view_1mois,
       crm_usages.pa_view_3mois,
       crm_usages.pa_view_6mois,
       crm_usages.pa_non_vides,
       crm_usages.pa_pilotables,
       crm_usages.fiches_non_vides,
       crm_usages.fiches_pilotables,
       crm_usages._5fiches_1pilotage,
       crm_usages.fiches_changement_statut,
       crm_usages.pourcentage_fa_privee,
       crm_usages.pourcentage_fa_pilotable_privee,
       crm_usages.indicateur_prive,
       crm_usages.min1_indicateur_prive,
       crm_usages.min1_indicateur_predef_prive,
       crm_usages.min1_indicateur_perso_prive,
       crm_usages.pourcentage_indicateur_predef_prives,
       crm_usages.type_pa
FROM stats.crm_usages
WHERE is_service_role();

COMMIT;
