-- Deploy tet:plan_action/fiches to pg

BEGIN;



-- 1. Drop en cascade les views et fonctions dépendantes de public.fiche_action :
-- -> vw private.fiches_action
--    ↪ vw public.fiches_action
--      ↪ fn public.plan_action_export

drop function public.plan_action_export;
drop view public.fiches_action;
drop view private.fiches_action;


-- view private.fiche_resume;
-- ↪ fn filter_fiches_action
-- ↪ fn create_fiche
-- ↪ fn fiche_resume(fiche_action_action)
-- ↪ fn fiche_resume(fiche_action_indicateur)

drop function public.filter_fiches_action(
    collectivite_id integer, 
    sans_plan boolean, 
    axes_id integer[], 
    sans_pilote boolean,
    pilotes personne[],
    sans_referent boolean,
    referents personne[],
    sans_niveau boolean,
    niveaux_priorite fiche_action_niveaux_priorite[],
    sans_statut boolean,
    statuts fiche_action_statuts[],
    sans_budget boolean,
    budget_min integer,
    budget_max integer,
    sans_date boolean,
    date_debut timestamp with time zone,
    date_fin timestamp with time zone,
    echeance fiche_action_echeances,
    "limit" integer
);

drop function public.create_fiche(
    collectivite_id integer, 
    axe_id integer, 
    action_id action_id, 
    indicateur_id integer
);

DROP FUNCTION public.fiche_resume(fiche_action_action fiche_action_action);
DROP FUNCTION public.fiche_resume(fiche_action_indicateur fiche_action_indicateur);


drop view public.fiche_resume;
drop view private.fiche_resume;

drop view public.crm_usages;
drop materialized view stats.crm_usages;


-- 2. Pour pouvoir rollback le champ `titre` de la table `fiche_action`

ALTER TABLE fiche_action
ALTER COLUMN titre TYPE VARCHAR(300);



-- 3. Puis, recrée les vues et fonctions dépendantes

CREATE OR REPLACE VIEW private.fiche_resume
 AS
 SELECT p.plans,
    fa.titre,
    fa.id,
    fa.statut,
    fa.collectivite_id,
    ( SELECT array_agg(ROW(pil.nom, pil.collectivite_id, pil.tag_id, pil.user_id)::personne) AS array_agg
           FROM ( SELECT COALESCE(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) AS nom,
                    pt.collectivite_id,
                    fap.tag_id,
                    fap.user_id
                   FROM fiche_action_pilote fap
                     LEFT JOIN personne_tag pt ON fap.tag_id = pt.id
                     LEFT JOIN dcp ON fap.user_id = dcp.user_id
                  WHERE fap.fiche_id = fa.id) pil) AS pilotes,
    fa.modified_at,
    fa.date_fin_provisoire,
    fa.niveau_priorite,
    fa.restreint,
    fa.amelioration_continue
   FROM fiche_action fa
     LEFT JOIN ( SELECT faa.fiche_id,
            array_agg(DISTINCT plan.*) AS plans
           FROM fiche_action_axe faa
             JOIN axe ON faa.axe_id = axe.id
             JOIN axe plan ON axe.plan = plan.id
          GROUP BY faa.fiche_id) p ON p.fiche_id = fa.id
  GROUP BY fa.titre, fa.id, fa.statut, fa.collectivite_id, p.plans
  ORDER BY (naturalsort(fa.titre::text));


CREATE OR REPLACE VIEW public.fiche_resume
 AS
 SELECT fr.plans,
    fr.titre,
    fr.id,
    fr.statut,
    fr.collectivite_id,
    fr.pilotes,
    fr.modified_at,
    fr.date_fin_provisoire,
    fr.niveau_priorite,
    fr.restreint,
    fr.amelioration_continue
   FROM private.fiche_resume fr
  WHERE can_read_acces_restreint(fr.collectivite_id);


CREATE OR REPLACE FUNCTION public.fiche_resume(fiche_action_indicateur fiche_action_indicateur)
 RETURNS SETOF fiche_resume
 LANGUAGE sql
 STABLE SECURITY DEFINER ROWS 1
BEGIN ATOMIC
 SELECT fr.plans,
     fr.titre,
     fr.id,
     fr.statut,
     fr.collectivite_id,
     fr.pilotes,
     fr.modified_at,
     fr.date_fin_provisoire,
     fr.niveau_priorite,
     fr.restreint,
     fr.amelioration_continue
    FROM private.fiche_resume fr
   WHERE ((fr.id = (fiche_resume.fiche_action_indicateur).fiche_id) AND can_read_acces_restreint(fr.collectivite_id));
END
;


CREATE OR REPLACE FUNCTION public.fiche_resume(fiche_action_action fiche_action_action)
 RETURNS SETOF fiche_resume
 LANGUAGE sql
 STABLE SECURITY DEFINER ROWS 1
BEGIN ATOMIC
 SELECT fr.plans,
     fr.titre,
     fr.id,
     fr.statut,
     fr.collectivite_id,
     fr.pilotes,
     fr.modified_at,
     fr.date_fin_provisoire,
     fr.niveau_priorite,
     fr.restreint,
     fr.amelioration_continue
    FROM private.fiche_resume fr
   WHERE ((fr.id = (fiche_resume.fiche_action_action).fiche_id) AND can_read_acces_restreint(fr.collectivite_id));
END
;


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


CREATE OR REPLACE FUNCTION public.create_fiche(collectivite_id integer, axe_id integer DEFAULT NULL::integer, action_id action_id DEFAULT NULL::character varying, indicateur_id integer DEFAULT NULL::integer)
 RETURNS fiche_resume
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
    new_fiche_id int;
    resume       fiche_resume;
begin
    if not have_edition_acces(create_fiche.collectivite_id) and not is_service_role()
    then
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''a pas de droit en édition sur la collectivité.';
    end if;

    insert into fiche_action (collectivite_id, titre)
    values (create_fiche.collectivite_id, '')
    returning id into new_fiche_id;

    if create_fiche.axe_id is not null
    then
        insert into fiche_action_axe (fiche_id, axe_id)
        values (new_fiche_id, create_fiche.axe_id);
    end if;

    if create_fiche.action_id is not null
    then
        insert into fiche_action_action (fiche_id, action_id)
        values (new_fiche_id, create_fiche.action_id);
    end if;

    if create_fiche.indicateur_id is not null
    then
        insert into fiche_action_indicateur (fiche_id, indicateur_id)
        values (new_fiche_id, create_fiche.indicateur_id);
    end if;

    select * from fiche_resume where id = new_fiche_id limit 1 into resume;
    return resume;
end;
$function$;


CREATE OR REPLACE FUNCTION public.filter_fiches_action(collectivite_id integer, sans_plan boolean DEFAULT false, axes_id integer[] DEFAULT NULL::integer[], sans_pilote boolean DEFAULT false, pilotes personne[] DEFAULT NULL::personne[], sans_referent boolean DEFAULT false, referents personne[] DEFAULT NULL::personne[], sans_niveau boolean DEFAULT false, niveaux_priorite fiche_action_niveaux_priorite[] DEFAULT NULL::fiche_action_niveaux_priorite[], sans_statut boolean DEFAULT false, statuts fiche_action_statuts[] DEFAULT NULL::fiche_action_statuts[], sans_budget boolean DEFAULT false, budget_min integer DEFAULT NULL::integer, budget_max integer DEFAULT NULL::integer, sans_date boolean DEFAULT false, date_debut timestamp with time zone DEFAULT NULL::timestamp with time zone, date_fin timestamp with time zone DEFAULT NULL::timestamp with time zone, echeance fiche_action_echeances DEFAULT NULL::fiche_action_echeances, "limit" integer DEFAULT 10)
 RETURNS SETOF fiche_resume
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
    # variable_conflict use_variable
begin
    if not can_read_acces_restreint(filter_fiches_action.collectivite_id) then
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''a pas de droit en lecture sur la collectivité.';
    end if;

    return query
        select fr.*
        from fiche_resume fr
                 join fiche_action fa on fr.id = fa.id
        where fr.collectivite_id = filter_fiches_action.collectivite_id
          and case -- axes_id
                  when sans_plan then
                      fr.id not in (select distinct fiche_id from fiche_action_axe)
                  when axes_id is null then true
                  else fr.id in (with child as (select a.axe_id as axe_id
                                                from axe_descendants a
                                                where a.parents && (axes_id)
                                                   or a.axe_id in (select * from unnest(axes_id)))
                                 select fiche_id
                                 from child
                                          join fiche_action_axe using (axe_id))
            end
          and case -- pilotes
                  when sans_pilote then
                      fr.id not in (select distinct fiche_id from fiche_action_pilote)
                  when pilotes is null then true
                  else fr.id in
                       (select fap.fiche_id
                        from fiche_action_pilote fap
                        where fap.tag_id in (select (pi::personne).tag_id from unnest(pilotes) pi)
                           or fap.user_id in (select (pi::personne).user_id from unnest(pilotes) pi))
            end
          and case -- referents
                  when sans_referent then
                      fr.id not in (select distinct fiche_id from fiche_action_referent)
                  when referents is null then true
                  else fr.id in
                       (select far.fiche_id
                        from fiche_action_referent far
                        where far.tag_id in (select (re::personne).tag_id from unnest(referents) re)
                           or far.user_id in (select (re::personne).user_id from unnest(referents) re))
            end
          and case -- niveaux_priorite
                  when sans_niveau then fa.niveau_priorite is null
                  when niveaux_priorite is null then true
                  else fa.niveau_priorite in (select * from unnest(niveaux_priorite::fiche_action_niveaux_priorite[]))
            end
          and case -- statuts
                  when sans_statut then fa.statut is null
                  when statuts is null then true
                  else fr.statut in (select * from unnest(statuts::fiche_action_statuts[]))
            end
          and case -- budget_min
                  when sans_budget then fa.budget_previsionnel is null
                  when budget_min is null then true
                  when fa.budget_previsionnel is null then false
                  else fa.budget_previsionnel >= budget_min
            end
          and case -- budget_max
                  when sans_budget then fa.budget_previsionnel is null
                  when budget_max is null then true
                  when fa.budget_previsionnel is null then false
                  else fa.budget_previsionnel <= budget_max
            end
          and case -- date_debut
                  when sans_date then fa.date_debut is null
                  when filter_fiches_action.date_debut is null then true
                  when fa.date_debut is null then false
                  else fa.date_debut <= filter_fiches_action.date_debut
            end
          and case -- date_fin
                  when sans_date then fa.date_fin_provisoire is null
                  when date_fin is null then true
                  when fa.date_fin_provisoire is null then false
                  else fa.date_fin_provisoire <= date_fin
            end
          and case -- echeances
                  when echeance is null then true
                  when echeance = 'Action en amélioration continue'
                      then fa.amelioration_continue
                  when echeance = 'Sans échéance'
                      then fa.date_fin_provisoire is null
                  when echeance = 'Échéance dépassée'
                      then fa.date_fin_provisoire > now()
                  when echeance = 'Échéance dans moins de trois mois'
                      then fa.date_fin_provisoire < (now() + interval '3 months')
                  when echeance = 'Échéance entre trois mois et 1 an'
                      then fa.date_fin_provisoire >= (now() + interval '3 months')
                      and fa.date_fin_provisoire < (now() + interval '1 year')
                  when echeance = 'Échéance dans plus d’un an'
                      then fa.date_fin_provisoire > (now() + interval '1 year')
                  else false
            end
        order by naturalsort(fr.titre)
        limit filter_fiches_action."limit";
end;
$function$;



create view private.fiches_action as
SELECT fa.modified_at,
       fa.id,
       fa.titre,
       fa.description,
       fa.piliers_eci,
       fa.objectifs,
       fa.resultats_attendus,
       fa.cibles,
       fa.ressources,
       fa.financements,
       fa.budget_previsionnel,
       fa.statut,
       fa.niveau_priorite,
       fa.date_debut,
       fa.date_fin_provisoire,
       fa.amelioration_continue,
       fa.calendrier,
       fa.notes_complementaires,
       fa.maj_termine,
       fa.collectivite_id,
       fa.created_at,
       fa.modified_by,
       t.thematiques,
       st.sous_thematiques,
       p.partenaires,
       s.structures,
       (SELECT array_agg(ROW (pil.nom, pil.collectivite_id, pil.tag_id, pil.user_id)::personne) AS array_agg
        FROM (SELECT COALESCE(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) AS nom,
                     pt.collectivite_id,
                     fap.tag_id,
                     fap.user_id
              FROM fiche_action_pilote fap
              LEFT JOIN personne_tag pt ON fap.tag_id = pt.id
              LEFT JOIN dcp ON fap.user_id = dcp.user_id
              WHERE fap.fiche_id = fa.id) pil)  AS pilotes,
       (SELECT array_agg(ROW (ref.nom, ref.collectivite_id, ref.tag_id, ref.user_id)::personne) AS array_agg
        FROM (SELECT COALESCE(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) AS nom,
                     pt.collectivite_id,
                     far.tag_id,
                     far.user_id
              FROM fiche_action_referent far
              LEFT JOIN personne_tag pt ON far.tag_id = pt.id
              LEFT JOIN dcp ON far.user_id = dcp.user_id
              WHERE far.fiche_id = fa.id) ref)  AS referents,
       pla.axes,
       act.actions,
       (SELECT array_agg(indi.*::indicateur_definition) AS array_agg
        FROM (SELECT id.*
              FROM fiche_action_indicateur fai
              JOIN indicateur_definition id ON fai.indicateur_id::text = id.id::text
              WHERE fai.fiche_id = fa.id) indi) AS indicateurs,
       ser.services,
       (SELECT array_agg(ROW (fin.financeur_tag, fin.montant_ttc, fin.id)::financeur_montant) AS financeurs
        FROM (SELECT ft.*::financeur_tag AS financeur_tag,
                     faft.montant_ttc,
                     faft.id
              FROM financeur_tag ft
              JOIN fiche_action_financeur_tag faft ON ft.id = faft.financeur_tag_id
              WHERE faft.fiche_id = fa.id) fin) AS financeurs,
       fic.fiches_liees,
       fa.restreint
FROM fiche_action fa
LEFT JOIN (SELECT fath.fiche_id,
                  array_agg(th.*) AS thematiques
           FROM thematique th
           JOIN fiche_action_thematique fath ON fath.thematique_id = th.id
           GROUP BY fath.fiche_id) t ON t.fiche_id = fa.id
LEFT JOIN (SELECT fasth.fiche_id,
                  array_agg(sth.*) AS sous_thematiques
           FROM sous_thematique sth
           JOIN fiche_action_sous_thematique fasth ON fasth.thematique_id = sth.id
           GROUP BY fasth.fiche_id) st ON st.fiche_id = fa.id
LEFT JOIN (SELECT fapt.fiche_id,
                  array_agg(pt.*) AS partenaires
           FROM partenaire_tag pt
           JOIN fiche_action_partenaire_tag fapt ON fapt.partenaire_tag_id = pt.id
           GROUP BY fapt.fiche_id) p ON p.fiche_id = fa.id
LEFT JOIN (SELECT fast.fiche_id,
                  array_agg(st_1.*) AS structures
           FROM structure_tag st_1
           JOIN fiche_action_structure_tag fast ON fast.structure_tag_id = st_1.id
           GROUP BY fast.fiche_id) s ON s.fiche_id = fa.id
LEFT JOIN (SELECT fapa.fiche_id,
                  array_agg(pa.*) AS axes
           FROM axe pa
           JOIN fiche_action_axe fapa ON fapa.axe_id = pa.id
           GROUP BY fapa.fiche_id) pla ON pla.fiche_id = fa.id
LEFT JOIN (SELECT faa.fiche_id,
                  array_agg(ar.*) AS actions
           FROM action_relation ar
           JOIN fiche_action_action faa ON faa.action_id::text = ar.id::text
           GROUP BY faa.fiche_id) act ON act.fiche_id = fa.id
LEFT JOIN (SELECT fast.fiche_id,
                  array_agg(st_1.*) AS services
           FROM service_tag st_1
           JOIN fiche_action_service_tag fast ON fast.service_tag_id = st_1.id
           GROUP BY fast.fiche_id) ser ON ser.fiche_id = fa.id
LEFT JOIN (SELECT falpf.fiche_id,
                  array_agg(fr.*) AS fiches_liees
           FROM private.fiche_resume fr
           JOIN fiches_liees_par_fiche falpf ON falpf.fiche_liee_id = fr.id
           GROUP BY falpf.fiche_id) fic ON fic.fiche_id = fa.id
;


create view public.fiches_action as
SELECT fiches_action.modified_at,
       fiches_action.id,
       fiches_action.titre,
       fiches_action.description,
       fiches_action.piliers_eci,
       fiches_action.objectifs,
       fiches_action.resultats_attendus,
       fiches_action.cibles,
       fiches_action.ressources,
       fiches_action.financements,
       fiches_action.budget_previsionnel,
       fiches_action.statut,
       fiches_action.niveau_priorite,
       fiches_action.date_debut,
       fiches_action.date_fin_provisoire,
       fiches_action.amelioration_continue,
       fiches_action.calendrier,
       fiches_action.notes_complementaires,
       fiches_action.maj_termine,
       fiches_action.collectivite_id,
       fiches_action.created_at,
       fiches_action.modified_by,
       fiches_action.thematiques,
       fiches_action.sous_thematiques,
       fiches_action.partenaires,
       fiches_action.structures,
       fiches_action.pilotes,
       fiches_action.referents,
       fiches_action.axes,
       fiches_action.actions,
       fiches_action.indicateurs,
       fiches_action.services,
       fiches_action.financeurs,
       fiches_action.fiches_liees,
       fiches_action.restreint
FROM private.fiches_action
WHERE CASE
          WHEN fiches_action.restreint = true THEN have_lecture_acces(fiches_action.collectivite_id) OR est_support()
          ELSE can_read_acces_restreint(fiches_action.collectivite_id)
      END;

create trigger upsert
    instead of insert or update
    on public.fiches_action
    for each row
execute procedure upsert_fiche_action();



create function public.plan_action_export(id integer) returns SETOF fiche_action_export
    language sql
BEGIN ATOMIC
WITH RECURSIVE parents AS (
                          SELECT axe.id,
                                 axe.nom,
                                 axe.collectivite_id,
                                 0 AS depth,
                                 ARRAY[]::text[] AS path,
                                 ('0 '::text || axe.nom) AS sort_path
                          FROM axe
                          WHERE ((axe.parent IS NULL) AND (axe.id = plan_action_export.id) AND can_read_acces_restreint(axe.collectivite_id))
                          UNION ALL
                          SELECT a.id,
                                 a.nom,
                                 a.collectivite_id,
                                 (p_1.depth + 1),
                                 (p_1.path || p_1.nom),
                                 ((((p_1.sort_path || ' '::text) || (p_1.depth + 1)) || ' '::text) || a.nom)
                          FROM (parents p_1
                              JOIN axe a ON ((a.parent = p_1.id)))
                          ), fiches AS (
                          SELECT a.id AS axe_id,
                                 f_1.*::fiches_action AS fiche,
                                 f_1.titre
                          FROM ((parents a
                              JOIN fiche_action_axe faa ON ((a.id = faa.axe_id)))
                              JOIN fiches_action f_1 ON (((f_1.collectivite_id = a.collectivite_id) AND (faa.fiche_id = f_1.id))))
                          )
SELECT p.id,
       p.nom,
       p.path,
       to_jsonb(f.*) AS to_jsonb
FROM (parents p
    LEFT JOIN fiches f ON ((p.id = f.axe_id)))
ORDER BY (naturalsort((p.sort_path || (COALESCE(f.titre, ''::character varying))::text)));
END;


-- 4. Pour finir, drop la collation
DROP COLLATION IF EXISTS case_insensitive;

COMMIT;

