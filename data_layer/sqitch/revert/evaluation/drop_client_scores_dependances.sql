-- Revert tet:evaluation/drop_client_scores_dependances from pg

BEGIN;

set statement_timeout = '30min';

create materialized view stats.pourcentage_completude as
WITH score AS (SELECT client_scores.collectivite_id,
                      jsonb_array_elements(client_scores.scores) AS o
               FROM client_scores),
     eci AS (SELECT score.collectivite_id,
                    (score.o ->> 'completed_taches_count'::text)::integer AS completed_taches_count,
                    (score.o ->> 'total_taches_count'::text)::integer     AS total_taches_count
             FROM score
             WHERE score.o @> '{"action_id": "eci"}'::jsonb),
     cae AS (SELECT score.collectivite_id,
                    (score.o ->> 'completed_taches_count'::text)::integer AS completed_taches_count,
                    (score.o ->> 'total_taches_count'::text)::integer     AS total_taches_count
             FROM score
             WHERE score.o @> '{"action_id": "cae"}'::jsonb)
SELECT c.collectivite_id,
       eci.completed_taches_count::double precision / eci.total_taches_count::double precision * 100::double precision AS completude_eci,
       cae.completed_taches_count::double precision / cae.total_taches_count::double precision * 100::double precision AS completude_cae
FROM stats.collectivite_active c
     LEFT JOIN eci ON eci.collectivite_id = c.collectivite_id
     LEFT JOIN cae ON cae.collectivite_id = c.collectivite_id
ORDER BY c.collectivite_id;

create materialized view stats.locales_pourcentage_completude as
WITH score AS (SELECT client_scores.collectivite_id,
                      jsonb_array_elements(client_scores.scores) AS o
               FROM client_scores),
     eci AS (SELECT score.collectivite_id,
                    (score.o ->> 'completed_taches_count'::text)::integer AS completed_taches_count,
                    (score.o ->> 'total_taches_count'::text)::integer     AS total_taches_count
             FROM score
             WHERE score.o @> '{"action_id": "eci"}'::jsonb),
     cae AS (SELECT score.collectivite_id,
                    (score.o ->> 'completed_taches_count'::text)::integer AS completed_taches_count,
                    (score.o ->> 'total_taches_count'::text)::integer     AS total_taches_count
             FROM score
             WHERE score.o @> '{"action_id": "cae"}'::jsonb)
SELECT c.collectivite_id,
       c.region_code,
       c.departement_code,
       COALESCE(eci.completed_taches_count::double precision / eci.total_taches_count::double precision * 100::double precision, 0::double precision) AS completude_eci,
       COALESCE(cae.completed_taches_count::double precision / cae.total_taches_count::double precision * 100::double precision, 0::double precision) AS completude_cae
FROM stats.collectivite c
     LEFT JOIN eci ON eci.collectivite_id = c.collectivite_id
     LEFT JOIN cae ON cae.collectivite_id = c.collectivite_id
ORDER BY c.collectivite_id;

create materialized view stats_tranche_completude
as
with bounds as (select unnest('{0, 20, 50, 80,  100}'::numeric[]) as bound),
     ranges as (select numrange(lower.bound, upper.bound) as range,
                       lower.bound                        as lower_bound,
                       upper.bound                        as upper_bound
                from bounds lower
                         left join lateral (select * from bounds b where b.bound > lower.bound limit 1) upper on true),
     completude as (select coalesce(completude_eci, .0) as completude_eci,
                           coalesce(completude_cae, .0) as completude_cae
                    from stats.pourcentage_completude)
select lower_bound,
       upper_bound,
       eci,
       cae,
       -- compatibilité avec la version pre 1.20.0
       lower_bound::int || ':' || coalesce(upper_bound::int, 100 ) as bucket
from ranges r
         left join lateral (select count(*) filter ( where r.range @> c.completude_eci::numeric ) as eci,
                                   count(*) filter ( where r.range @> c.completude_cae::numeric ) as cae
                            from completude c) in_range on true
;

-- view retool_completude
create view retool_completude
    (collectivite_id, nom, region_name, departement_name, type_collectivite, population_totale,
     code_siren_insee, completude_eci, completude_cae)
as
WITH active AS (SELECT retool_active_collectivite.collectivite_id,
                       retool_active_collectivite.nom
                FROM retool_active_collectivite),
     score AS (SELECT client_scores.collectivite_id,
                      jsonb_array_elements(client_scores.scores) AS o
               FROM client_scores),
     eci AS (SELECT score.collectivite_id,
                    (score.o ->> 'completed_taches_count'::text)::integer   AS completed_taches_count,
                    (score.o ->> 'total_taches_count'::text)::integer       AS total_taches_count,
                    (score.o ->> 'point_fait'::text)::double precision      AS point_fait,
                    (score.o ->> 'point_programme'::text)::double precision AS point_programme
             FROM score
             WHERE score.o @> '{
               "action_id": "eci"
             }'::jsonb),
     cae AS (SELECT score.collectivite_id,
                    (score.o ->> 'completed_taches_count'::text)::integer   AS completed_taches_count,
                    (score.o ->> 'total_taches_count'::text)::integer       AS total_taches_count,
                    (score.o ->> 'point_fait'::text)::double precision      AS point_fait,
                    (score.o ->> 'point_programme'::text)::double precision AS point_programme
             FROM score
             WHERE score.o @> '{
               "action_id": "cae"
             }'::jsonb)
SELECT c.collectivite_id,
       c.nom,
       cci.region_name,
       cci.departement_name,
       cci.type_collectivite,
       cci.population_totale,
       cci.code_siren_insee,
       eci.completed_taches_count::double precision / eci.total_taches_count::double precision *
       100::double precision AS completude_eci,
       cae.completed_taches_count::double precision / cae.total_taches_count::double precision *
       100::double precision AS completude_cae
FROM active c
       LEFT JOIN eci ON eci.collectivite_id = c.collectivite_id
       LEFT JOIN cae ON cae.collectivite_id = c.collectivite_id
       LEFT JOIN collectivite_carte_identite cci ON cci.collectivite_id = c.collectivite_id
WHERE is_service_role()
ORDER BY c.collectivite_id;
comment on view retool_completude is 'Completude computed from client scores';

select cron.schedule('refresh_stats_completude',
                     '0 0 * * *', -- every day
                     $$refresh materialized view stats_tranche_completude$$);

-- private.convert_client_scores n'existe plus : la fonction était déjà inutilisable.
set local check_function_bodies = off;
CREATE OR REPLACE FUNCTION labellisation.critere_action(collectivite_id integer)
 RETURNS TABLE(referentiel referentiel, etoiles labellisation.etoile, action_id action_id, formulation text, score_realise double precision, min_score_realise double precision, score_programme double precision, min_score_programme double precision, atteint boolean, prio integer)
 LANGUAGE sql
 STABLE
AS $function$
with scores as (select s.*
                from client_scores cs
                         join private.convert_client_scores(cs.scores) s on true
                where cs.collectivite_id = critere_action.collectivite_id)
select ss.referentiel,
       cla.etoile,
       cla.action_id,
       cla.formulation,
       ss.proportion_fait,
       cla.min_realise_percentage,
       ss.proportion_programme,
       cla.min_programme_percentage,
       case
           -- l'action a une sous-action parente `sa`, qui a un statut `exists`
           when sa is not null
               and exists(select *
                          from action_statut s
                          where s.action_id = sa.action_id
                            and s.collectivite_id = critere_action.collectivite_id
                            and s.avancement != 'non_renseigne'
                            and s.concerne)
               then
                   coalesce(sass.proportion_fait * 100 >= cla.min_realise_percentage, false)
                   or coalesce((sass.proportion_programme + sass.proportion_fait) * 100 >=
                               cla.min_programme_percentage, false)
           -- sinon
           else -- le score fait est >= au critère fait
                   coalesce(ss.proportion_fait * 100 >= cla.min_realise_percentage, false)
                   -- le score fait + programme est >= au critère programme
                   or
                   coalesce((ss.proportion_programme + ss.proportion_fait) * 100 >= cla.min_programme_percentage, false)
           end as atteint,
       cla.prio
from labellisation_action_critere cla
         join scores sc on sc.action_id = cla.action_id
         join private.score_summary_of(sc) ss on true
         join private.action_node a on sc.action_id = a.action_id
    -- sous-action parente.
         left join private.action_node sa
                   on a.action_id = any (sa.descendants)
                       and a.type = 'tache'
                       and sa.type = 'sous-action'
    -- score sous-action parente
         left join scores sasc on sa.action_id = sasc.action_id
    -- score summary sous-action parente
         left join private.score_summary_of(sasc) sass on true
where not ss.desactive
$function$;
set local check_function_bodies = on;
comment on function labellisation.critere_action is 'Renvoie l''état des critères applicables à une collectivité donnée pour toute les étoiles.';

CREATE OR REPLACE FUNCTION stats.refresh_stats_locales() RETURNS void
  LANGUAGE plpgsql
AS
$$
BEGIN
  refresh materialized view stats.locales_collectivite_actives_et_total_par_type;
  refresh materialized view stats.locales_pourcentage_completude;
  refresh materialized view stats.evolution_nombre_fiches;
  refresh materialized view stats.locales_evolution_collectivite_avec_minimum_fiches;
  refresh materialized view stats.locales_evolution_nombre_fiches;
END
$$;

CREATE OR REPLACE FUNCTION stats.refresh_views() RETURNS void
AS
$$
BEGIN
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

  -- Removed: stats.carte_epci_par_departement

  refresh materialized view stats.pourcentage_completude;
  refresh materialized view stats.evolution_collectivite_avec_minimum_fiches;
  refresh materialized view stats.evolution_indicateur_referentiel;
  refresh materialized view stats.evolution_resultat_indicateur_referentiel;
  refresh materialized view stats.evolution_resultat_indicateur_personnalise;
  refresh materialized view stats.engagement_collectivite;
  refresh materialized view stats.evolution_nombre_fiches;
  refresh materialized view stats.evolution_nombre_plans;

  -- Removed: stats.evolution_nombre_labellisations
END ;
$$ language plpgsql security definer;

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
       WHERE visite.page = ANY (ARRAY['plan'::visite_page, 'fiche'::visite_page, 'tableau_de_bord'::visite_page])
         AND visite.collectivite_id = c.collectivite_id
         AND visite."time" >= (CURRENT_TIMESTAMP - '2 mons'::interval)
       )                                                               AS pa_view_2mois,
       (
       SELECT count(*) AS count
       FROM visite
       WHERE visite.page = ANY (ARRAY['plan'::visite_page, 'fiche'::visite_page, 'tableau_de_bord'::visite_page])
         AND visite.collectivite_id = c.collectivite_id
         AND visite."time" >= (CURRENT_TIMESTAMP - '6 mons'::interval)
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
      SELECT count(pa.id) AS count
      FROM 
        (
        SELECT p.collectivite_id, p.id, count(p.fiche_id) as nb_fiches
        FROM 
        (
          SELECT f.collectivite_id,
           p.id, 
           f.id as fiche_id
           FROM fiche_action f
           LEFT JOIN fiche_action_pilote fap ON f.id = fap.fiche_id
           LEFT JOIN fiche_action_structure_tag fas ON fas.fiche_id = f.id
           LEFT JOIN fiche_action_service_tag faserv ON faserv.fiche_id = f.id
           JOIN fiche_action_axe faa ON f.id = faa.fiche_id
           JOIN axe a ON a.id = faa.axe_id
           JOIN axe p ON a.plan = p.id
           WHERE (titre IS NOT NULL or titre != 'Nouvelle fiche')
           AND f.collectivite_id = c.collectivite_id
           AND f.statut IS NOT NULL
           AND p.nom IS NOT NULL
           GROUP BY f.collectivite_id, p.id, f.id
           HAVING (COUNT(DISTINCT fap.user_id) + COUNT(DISTINCT fap.tag_id) + COUNT(DISTINCT fas.structure_tag_id) + COUNT(DISTINCT faserv.service_tag_id)) > 0
        ) p
      group by p.collectivite_id, p.id
      ) pa 
      WHERE pa.nb_fiches > 4
      )                                                                AS pa_pilotables,
       (
       SELECT count(*) AS count
       FROM fiche_action f
       WHERE f.collectivite_id = c.collectivite_id
         AND (f.titre IS NOT NULL OR f.titre::text <> 'Nouvelle fiche'::text)
       )                                                               AS fiches_non_vides,
       (
       SELECT count(f_2.*) AS count
       FROM (
            SELECT f.id
            FROM fiche_action f
            LEFT JOIN fiche_action_pilote fap ON f.id = fap.fiche_id
            LEFT JOIN fiche_action_structure_tag fas ON fas.fiche_id = f.id
            LEFT JOIN fiche_action_service_tag faserv ON faserv.fiche_id = f.id
            WHERE f.collectivite_id = c.collectivite_id
              AND (f.titre IS NOT NULL AND f.titre <> 'Nouvelle fiche')
              AND f.statut IS NOT NULL
            GROUP BY f.id
            HAVING (COUNT(DISTINCT fap.user_id) + 
                  COUNT(DISTINCT fap.tag_id) + 
                  COUNT(DISTINCT fas.structure_tag_id) + 
                  COUNT(DISTINCT faserv.service_tag_id)) > 0
            ) f_2
        )                                                              AS fiches_pilotables,                                                            
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
       (SELECT array_to_string(array_agg(DISTINCT pat.type::text), ',') AS array_to_string
       FROM (
            SELECT p.id,
                   count(f_1.*) AS nb_fiche
            FROM fiche_action f_1
            JOIN fiche_action_axe faa ON f_1.id = faa.fiche_id
            JOIN axe a_1 ON a_1.id = faa.axe_id
            JOIN axe p ON a_1.plan = p.id
            WHERE f_1.collectivite_id = c.collectivite_id
              AND (f_1.titre IS NOT NULL OR f_1.titre::text <> 'Nouvelle fiche'::text)
              AND p.nom IS NOT NULL
            GROUP BY p.id
            ) f
       JOIN axe a ON f.id = a.id
       LEFT JOIN plan_action_type pat ON a.type = pat.id
       WHERE f.nb_fiche > 4
       )                                                               AS type_pa_non_vides,
       
       (
       select count(*)
       from axe a
       where a.nom = 'Plan d''action à impact'
       and a.collectivite_id = c.collectivite_id
       )                                                             AS pai,
       (
       select count(f_1.*) as nb_fiches
       from fiche_action f_1
       JOIN fiche_action_axe faa ON f_1.id = faa.fiche_id
       JOIN axe a on a.id = faa.axe_id
       where a.nom = 'Plan d''action à impact'
       and f_1.collectivite_id = c.collectivite_id
        )                                                             AS fiches_pai
FROM stats.collectivite c
JOIN stats.collectivite_active USING (collectivite_id)
LEFT JOIN comptes x USING (collectivite_id)
LEFT JOIN stats.pourcentage_completude pc USING (collectivite_id)
LEFT JOIN premier_rattachements pr USING (collectivite_id)
ORDER BY c.nom;


comment on column stats.crm_usages.pa_date_creation is 'Date de création du premier plan (avec +5 FA non vides) pour chaque collectivité concernées';
comment on column stats.crm_usages.pa_view_2mois is 'Nombre de consultations des pages "plans, fiches ou TDB" au cours des 2 derniers mois';
comment on column stats.crm_usages.pa_view_6mois is 'Nombre de consultations des pages "plans, fiches ou TDB" au cours des 6 derniers mois';
comment on column stats.crm_usages.pa_non_vides is 'Nombre de plans non vides (minimum un titre de PA et 5 FA non vides)';
comment on column stats.crm_usages.pa_pilotables is 'Nombre de plans “pilotables” (= plan avec à minima 5 fiches avec titre, statut, et l’un des 3 champs suivants renseignés : pilote, service, structure)';
comment on column stats.crm_usages.fiches_non_vides is 'Nombre de fiches actions non vides';
comment on column stats.crm_usages.fiches_pilotables is 'Nombre de fiches actions pilotables (= à minima titre, statut, et l’un des 3 champs suivants renseignés : pilote, service, structure)';
comment on column stats.crm_usages._5fiches_1pilotage is 'Nombre de collectivités qui ont au moins 5 FA avec au moins le titre + 1 critère de pilotage renseigné (soit statut ou priorité ou date prévisionnelle ou responsable)';
comment on column stats.crm_usages.fiches_changement_statut is 'Nombre de changements de statut de fiches actions dans les 6 derniers mois par collectivité (tous les status)';
comment on column stats.crm_usages.pourcentage_fa_privee is '% de fiches action privées par collectivité';
comment on column stats.crm_usages.pourcentage_fa_pilotable_privee is '% de fiches action pilotables privées (avec au moins un titre rempli, le pilote et le statut)';
comment on column stats.crm_usages.indicateur_prive is 'Nombre d''indicateurs privés par collectivité';
comment on column stats.crm_usages.min1_indicateur_prive is 'Vrai si au moins un indicateur privé';
comment on column stats.crm_usages.min1_indicateur_predef_prive is 'Vrai si au moins un indicateur prédéfini privé';
comment on column stats.crm_usages.min1_indicateur_perso_prive is 'Vrai si au moins un indicateur perso privé';
comment on column stats.crm_usages.pourcentage_indicateur_predef_prives is '% d''indicateur prédéfini privé par collectivité';
comment on column stats.crm_usages.type_pa_non_vides is 'Liste de tous les types des plans de la collectivité non vides (minimum un titre de PA et 5 FA non vides)';
comment on column stats.crm_usages.pai is 'Nombre de plans d''actions à impact importés';
comment on column stats.crm_usages.fiches_pai is 'Nombre de fiches dans plans d''actions à impact';

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
       crm_usages.pa_view_2mois,
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
       crm_usages.type_pa_non_vides,
       crm_usages.pai,
       crm_usages.fiches_pai
FROM stats.crm_usages
WHERE is_service_role();


create or replace function stats.refresh_views_crm() returns void
    security definer
    language plpgsql
as
$$
begin
    refresh materialized view stats.crm_usages;
    refresh materialized view stats.crm_indicateurs;
    refresh materialized view stats.crm_plans;
end ;
$$;

create or replace function delete_collectivite_test(collectivite_id integer) returns void
  security definer
  language plpgsql
as
$$
begin

  if not is_service_role() then
    perform set_config('response.status', '401', true);
    raise 'Seul le service role peut supprimer une collectivité test';
  end if;
  if(select count(*)=0 from collectivite where id = delete_collectivite_test.collectivite_id and type = 'test') then
    perform set_config('response.status', '401', true);
    raise 'La collectivité test % n''existe pas', delete_collectivite_test.collectivite_id ;
  end if;

  -- Documents
  delete from annexe where annexe.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from preuve_audit where preuve_audit.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from preuve_complementaire where preuve_complementaire.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from preuve_labellisation where preuve_labellisation.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from preuve_rapport where preuve_rapport.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from preuve_reglementaire where preuve_reglementaire.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from labellisation.bibliotheque_fichier where bibliotheque_fichier.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from collectivite_bucket where collectivite_bucket.collectivite_id = delete_collectivite_test.collectivite_id;


  -- Labellisation
  delete from labellisation.action_audit_state where action_audit_state.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from audit_auditeur where audit_id in (
    select id
    from labellisation.audit
    where audit.collectivite_id = delete_collectivite_test.collectivite_id
  );
  delete from post_audit_scores where post_audit_scores.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from pre_audit_scores where pre_audit_scores.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from labellisation where labellisation.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from labellisation.audit where audit.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from labellisation.demande where demande.collectivite_id = delete_collectivite_test.collectivite_id;


  -- Référentiel
  delete from action_discussion where action_discussion.collectivite_id = delete_collectivite_test.collectivite_id; -- action_discussion_commentaire on cascade
  delete from action_statut where action_statut.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from action_commentaire where action_commentaire.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from client_scores where client_scores.collectivite_id = delete_collectivite_test.collectivite_id;

  -- Plan action
  perform delete_axe_all(axe.id)
  from axe
  where axe.parent is null
    and axe.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from fiche_action where fiche_action.collectivite_id = delete_collectivite_test.collectivite_id;

  -- Indicateur
  delete from indicateur_valeur where indicateur_valeur.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from indicateur_definition where indicateur_definition.collectivite_id = delete_collectivite_test.collectivite_id;

  -- Tags
  delete from personne_tag where personne_tag.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from service_tag where service_tag.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from financeur_tag where financeur_tag.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from partenaire_tag where partenaire_tag.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from structure_tag where structure_tag.collectivite_id = delete_collectivite_test.collectivite_id;

  -- Personnalisation
  delete from reponse_binaire where reponse_binaire.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from reponse_choix where reponse_choix.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from reponse_proportion where reponse_proportion.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from justification where justification.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from justification_ajustement where justification_ajustement.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from personnalisation_consequence where personnalisation_consequence.collectivite_id = delete_collectivite_test.collectivite_id;

  -- Droits
  delete from private_utilisateur_droit where private_utilisateur_droit.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from private_collectivite_membre where private_collectivite_membre.collectivite_id = delete_collectivite_test.collectivite_id;

  -- Usages
  delete from usage where usage.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from visite where visite.collectivite_id = delete_collectivite_test.collectivite_id;

  -- Collectivite
  delete from cot where cot.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from collectivite_test where collectivite_test.collectivite_id = delete_collectivite_test.collectivite_id;
  delete from collectivite where id = delete_collectivite_test.collectivite_id;
end;
$$;

COMMIT;
