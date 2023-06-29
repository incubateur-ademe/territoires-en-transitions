-- Deploy tet:retool/correction_droit to pg

BEGIN;

-- Vue retool_active_collectivite
create or replace view retool_active_collectivite(collectivite_id, nom) as
SELECT c.collectivite_id,
       c.nom
FROM named_collectivite c
WHERE (c.collectivite_id IN (SELECT private_utilisateur_droit.collectivite_id
                             FROM private_utilisateur_droit
                             WHERE private_utilisateur_droit.active))
  AND NOT (c.collectivite_id IN (SELECT collectivite_test.collectivite_id
                                 FROM collectivite_test))
  and is_service_role()
ORDER BY c.nom;

-- Vue retool_audit
create or replace view retool_audit
            (collectivite_id, nom, referentiel, date_debut, date_fin, type_audit, envoyee_le, date_attribution) as
WITH auditeur AS (SELECT aa.audit_id,
                         min(aa.created_at) AS date_attribution
                  FROM audit_auditeur aa
                  GROUP BY aa.audit_id)
SELECT a.collectivite_id,
       nc.nom,
       a.referentiel,
       a.date_debut,
       a.date_fin,
       CASE
           WHEN d.* IS NULL THEN 'audit sans demande'::text
           ELSE d.sujet::text
           END AS type_audit,
       d.envoyee_le,
       auditeur.date_attribution
FROM labellisation.audit a
         JOIN named_collectivite nc USING (collectivite_id)
         LEFT JOIN (SELECT demande.id,
                           demande.sujet,
                           demande.envoyee_le
                    FROM labellisation.demande
                    WHERE demande.en_cours = false) d ON a.demande_id = d.id
         LEFT JOIN auditeur ON auditeur.audit_id = a.id
WHERE (a.date_debut IS NOT NULL
    OR d.* IS NOT NULL)
  and is_service_role();

-- Vue retool_completude
create or replace view retool_completude
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
             WHERE score.o @> '{"action_id": "eci"}'::jsonb),
     cae AS (SELECT score.collectivite_id,
                    (score.o ->> 'completed_taches_count'::text)::integer   AS completed_taches_count,
                    (score.o ->> 'total_taches_count'::text)::integer       AS total_taches_count,
                    (score.o ->> 'point_fait'::text)::double precision      AS point_fait,
                    (score.o ->> 'point_programme'::text)::double precision AS point_programme
             FROM score
             WHERE score.o @> '{"action_id": "cae"}'::jsonb)
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
where is_service_role()
ORDER BY c.collectivite_id;

-- Vue retool_completude_compute
create or replace view retool_completude_compute(collectivite_id, nom, completude_eci, completude_cae) as
WITH active AS (SELECT retool_active_collectivite.collectivite_id,
                       retool_active_collectivite.nom
                FROM retool_active_collectivite),
     completed_eci AS (SELECT c_1.collectivite_id,
                              count(*) AS count
                       FROM active c_1
                                JOIN action_statut s ON s.collectivite_id = c_1.collectivite_id
                                JOIN action_relation r ON r.id::text = s.action_id::text
                       WHERE r.referentiel = 'eci'::referentiel
                       GROUP BY c_1.collectivite_id),
     eci_count AS (SELECT count(*) AS count
                   FROM action_relation r
                            JOIN action_children c_1 ON r.id::text = c_1.id::text
                   WHERE r.referentiel = 'eci'::referentiel
                     AND array_length(c_1.children, 1) IS NULL),
     completed_cae AS (SELECT c_1.collectivite_id,
                              count(*) AS count
                       FROM active c_1
                                JOIN action_statut s ON s.collectivite_id = c_1.collectivite_id
                                JOIN action_relation r ON r.id::text = s.action_id::text
                       WHERE r.referentiel = 'cae'::referentiel
                       GROUP BY c_1.collectivite_id),
     cae_count AS (SELECT count(*) AS count
                   FROM action_relation r
                            JOIN action_children c_1 ON r.id::text = c_1.id::text
                   WHERE r.referentiel = 'cae'::referentiel
                     AND array_length(c_1.children, 1) IS NULL)
SELECT c.collectivite_id,
       c.nom,
       round(compl_eci.count::numeric / c_eci.count::numeric * 100::numeric, 2) AS completude_eci,
       round(compl_cae.count::numeric / c_cae.count::numeric * 100::numeric, 2) AS completude_cae
FROM active c
         LEFT JOIN completed_eci compl_eci ON compl_eci.collectivite_id = c.collectivite_id
         LEFT JOIN completed_cae compl_cae ON compl_cae.collectivite_id = c.collectivite_id
         JOIN eci_count c_eci ON true
         JOIN cae_count c_cae ON true
    and is_service_role();

-- Vue retool_labellisation
create or replace view retool_labellisation
            (id, collectivite_id, referentiel, obtenue_le, annee, etoiles, score_realise, score_programme,
             collectivite_nom) as
SELECT l.id,
       l.collectivite_id,
       l.referentiel,
       l.obtenue_le,
       l.annee,
       l.etoiles,
       l.score_realise,
       l.score_programme,
       nc.nom AS collectivite_nom
FROM labellisation l
         JOIN named_collectivite nc ON l.collectivite_id = nc.collectivite_id
where is_service_role();

-- Vue retool_labellisation_demande
create or replace view retool_labellisation_demande
            (id, en_cours, collectivite_id, referentiel, etoiles, date, nom, sujet, envoyee_le, modified_at,
             demandeur_prenom, demandeur_nom, demandeur_email, demandeur_fonction)
as
SELECT ld.id,
       ld.en_cours,
       ld.collectivite_id,
       ld.referentiel,
       ld.etoiles,
       ld.date,
       nc.nom,
       ld.sujet,
       ld.envoyee_le,
       ld.modified_at,
       dcp.prenom   AS demandeur_prenom,
       dcp.nom      AS demandeur_nom,
       dcp.email    AS demandeur_email,
       pcm.fonction AS demandeur_fonction
FROM labellisation.demande ld
         LEFT JOIN named_collectivite nc ON ld.collectivite_id = nc.collectivite_id
         LEFT JOIN dcp ON dcp.user_id = ld.demandeur
         LEFT JOIN private_collectivite_membre pcm
                   ON ld.collectivite_id = pcm.collectivite_id AND dcp.user_id = pcm.user_id
where is_service_role();

-- Vue retool_plan_action_usage
create or replace view retool_plan_action_usage (collectivite_id, nom, nb_plans, nb_fiches, derniere_modif, nb_utilisateurs) as
SELECT col.collectivite_id,
       col.nom,
       count(DISTINCT axe.id) AS nb_plans,
       count(DISTINCT fac.id) AS nb_fiches,
       max(fac.modified_at)   AS derniere_modif,
       NULL::text             AS nb_utilisateurs
FROM named_collectivite col
         LEFT JOIN axe ON axe.collectivite_id = col.collectivite_id
         LEFT JOIN fiche_action fac ON fac.collectivite_id = col.collectivite_id
WHERE axe.parent IS NULL
  and is_service_role()
GROUP BY col.collectivite_id, col.nom;

COMMIT;
