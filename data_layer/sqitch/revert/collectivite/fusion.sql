-- Revert tet:collectivite/fusion from pg

BEGIN;

---------------------------------------------
-- ADAPTE LES VUES ET FONCTIONS CONCERNES  --
---------------------------------------------

create or replace view named_collectivite as
SELECT collectivite.id                                        AS collectivite_id,
       COALESCE(epci.nom, commune.nom, collectivite_test.nom) AS nom
FROM collectivite
       LEFT JOIN epci ON epci.collectivite_id = collectivite.id
       LEFT JOIN commune ON commune.collectivite_id = collectivite.id
       LEFT JOIN collectivite_test ON collectivite_test.collectivite_id = collectivite.id
ORDER BY (
           CASE
             WHEN collectivite_test.nom IS NOT NULL THEN '0'::text || unaccent(collectivite_test.nom::text)
             ELSE unaccent(COALESCE(epci.nom, commune.nom)::text)
             END);

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
  if(select count(*)=0 from collectivite_test where collectivite_test.collectivite_id = delete_collectivite_test.collectivite_id) then
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
  delete from client_scores_update where client_scores_update.collectivite_id = delete_collectivite_test.collectivite_id;

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

-----------------------------------------------
-- SUPPRIME LES VUES ET FONCTIONS CONCERNES  --
-----------------------------------------------

drop view stats_locales_evolution_total_activation;
drop materialized view stats.locales_evolution_total_activation;
drop view stats_locales_collectivite_actives_et_total_par_type;
drop materialized view stats.locales_collectivite_actives_et_total_par_type;
drop view stats_collectivite_actives_et_total_par_type;
drop materialized view stats.collectivite_actives_et_total_par_type;
drop view stats_evolution_total_activation_par_type;
drop materialized view stats.evolution_total_activation_par_type;
drop view stats_carte_collectivite_active;
drop view stats_locales_evolution_resultat_indicateur_referentiel;
drop materialized view stats.locales_evolution_resultat_indicateur_referentiel;
drop view stats_locales_evolution_collectivite_avec_indicateur;
drop materialized view stats.locales_evolution_collectivite_avec_indicateur_referentiel;
drop view crm_usages;
drop materialized view stats.crm_usages;
drop view stats_locales_evolution_indicateur_referentiel;
drop materialized view stats.locales_evolution_indicateur_referentiel;
drop view stats_locales_evolution_resultat_indicateur_personnalise;
drop materialized view stats.locales_evolution_resultat_indicateur_personnalise;
drop materialized view stats.report_indicateur_resultat;
drop view stats_locales_labellisation_par_niveau;
drop materialized view stats.locales_labellisation_par_niveau;
drop view stats_locales_evolution_nombre_fiches;
drop materialized view stats.locales_evolution_nombre_fiches;
drop view stats_locales_evolution_collectivite_avec_minimum_fiches;
drop materialized view stats.locales_evolution_collectivite_avec_minimum_fiches;
drop materialized view stats.collectivite_referentiel;
drop view crm_collectivites;
drop function indicateurs_gaz_effet_serre(site_labellisation);
drop function indicateur_artificialisation(site_labellisation);
drop function labellisations(site_labellisation);
drop function geojson(site_labellisation);
drop materialized view site_labellisation;
drop view crm_labellisations;
drop view crm_droits;
drop materialized view stats.engagement_collectivite;
drop view retool_plan_action_premier_usage;
drop materialized view private.retool_plan_action_premier_usage;
drop function stats.amplitude_visite(tstzrange);
drop materialized view stats.report_reponse_proportion;
drop materialized view stats.report_reponse_binaire;
drop materialized view stats.report_reponse_choix;
drop materialized view stats.report_scores;
drop view stats_locales_evolution_utilisateur;
drop materialized view stats.locales_evolution_utilisateur;
drop view stats_locales_evolution_nombre_utilisateur_par_collectivite;
drop materialized view stats.locales_evolution_nombre_utilisateur_par_collectivite;
drop view stats_locales_engagement_collectivite;
drop materialized view stats.locales_engagement_collectivite;
drop view stats_locales_tranche_completude;
drop materialized view stats.locales_tranche_completude;
drop materialized view stats.locales_pourcentage_completude;
drop materialized view stats.collectivite_plan_action;
drop view stats_carte_epci_par_departement;
drop materialized view stats.carte_epci_par_departement;
drop materialized view stats.carte_collectivite_active;
drop materialized view stats.evolution_connection;
drop materialized view stats.connection;
drop view stats_evolution_utilisateur;
drop materialized view stats.evolution_utilisateur;
drop materialized view stats.utilisateur;
drop materialized view stats.rattachement;
drop materialized view stats.collectivite_action_statut;
drop materialized view stats.evolution_activation;
drop materialized view stats.collectivite_utilisateur;
drop materialized view stats.collectivite_labellisation;
drop materialized view stats.collectivite;
drop view export_score_audit;
drop materialized view labellisation.export_score_audit;
drop view retool_completude;
drop view collectivite_carte_identite;
drop function labellisation.evaluate_audit_statuts;
drop function labellisation.audit_personnalisation_payload;
drop function evaluation.identite(collectivite_id integer);
drop view question_display;
drop view collectivite_identite;
drop function private.collectivite_type;
-- drop type type_collectivite;
drop function collectivite_card(axe);
drop materialized view collectivite_card;

-----------------------------------------------
-- RECREE LES VUES ET FONCTIONS CONCERNES  --
-----------------------------------------------

-- materialized view collectivite_card
create materialized view collectivite_card as
WITH meta_commune AS (SELECT com.collectivite_id,
                             ic.population,
                             ic.code AS insee,
                             ir.code AS region_code,
                             id.code AS departement_code
                      FROM commune com
                             LEFT JOIN imports.commune ic ON ic.code::text = com.code::text
                             LEFT JOIN imports.region ir ON ic.region_code::text = ir.code::text
                             LEFT JOIN imports.departement id ON ic.departement_code::text = id.code::text),
     meta_epci AS (SELECT epci.collectivite_id,
                          ib.population,
                          ib.siren,
                          ir.code AS region_code,
                          id.code AS departement_code
                   FROM epci
                          LEFT JOIN imports.banatic ib ON ib.siren::text = epci.siren::text
                          LEFT JOIN imports.region ir ON ib.region_code::text = ir.code::text
                          LEFT JOIN imports.departement id ON ib.departement_code::text = id.code::text),
     type_collectivite AS (SELECT c.id                                  AS collectivite_id,
                                  CASE
                                    WHEN (c.id IN (SELECT commune.collectivite_id
                                                   FROM commune)) THEN 'commune'::text
                                    WHEN e.nature = 'SMF'::nature OR e.nature = 'SIVOM'::nature OR
                                         e.nature = 'SMO'::nature OR e.nature = 'SIVU'::nature THEN 'syndicat'::text
                                    WHEN e.nature = 'CA'::nature THEN 'CA'::text
                                    WHEN e.nature = 'CU'::nature THEN 'CU'::text
                                    WHEN e.nature = 'CC'::nature THEN 'CC'::text
                                    WHEN e.nature = 'POLEM'::nature THEN 'POLEM'::text
                                    WHEN e.nature = 'METRO'::nature THEN 'METRO'::text
                                    WHEN e.nature = 'PETR'::nature THEN 'PETR'::text
                                    WHEN e.nature = 'EPT'::nature THEN 'EPT'::text
                                    ELSE NULL::text
                                    END::filterable_type_collectivite AS type
                           FROM collectivite c
                                  LEFT JOIN epci e ON c.id = e.collectivite_id),
     referentiel_score AS (SELECT c.id                                                                     AS collectivite_id,
                                  max(s.score_fait) FILTER (WHERE s.referentiel = 'eci'::referentiel)      AS score_fait_eci,
                                  max(s.score_fait) FILTER (WHERE s.referentiel = 'cae'::referentiel)      AS score_fait_cae,
                                  min(s.score_fait)                                                        AS score_fait_min,
                                  max(s.score_fait)                                                        AS score_fait_max,
                                  sum(s.score_fait)                                                        AS score_fait_sum,
                                  max(s.score_programme)
                                  FILTER (WHERE s.referentiel = 'eci'::referentiel)                        AS score_programme_eci,
                                  max(s.score_programme)
                                  FILTER (WHERE s.referentiel = 'cae'::referentiel)                        AS score_programme_cae,
                                  max(s.score_programme)                                                   AS score_programme_max,
                                  sum(s.score_programme)                                                   AS score_programme_sum,
                                  max(s.completude) FILTER (WHERE s.referentiel = 'eci'::referentiel)      AS completude_eci,
                                  max(s.completude) FILTER (WHERE s.referentiel = 'cae'::referentiel)      AS completude_cae,
                                  max(s.completude)                                                        AS completude_max,
                                  min(s.completude)                                                        AS completude_min,
                                  bool_and(s.concerne)
                                  FILTER (WHERE s.referentiel = 'eci'::referentiel)                        AS concerne_eci,
                                  bool_and(s.concerne)
                                  FILTER (WHERE s.referentiel = 'cae'::referentiel)                        AS concerne_cae
                           FROM collectivite c
                                  JOIN LATERAL ( SELECT referentiel_progress.referentiel,
                                                        referentiel_progress.score_fait,
                                                        referentiel_progress.score_programme,
                                                        referentiel_progress.completude,
                                                        referentiel_progress.complet,
                                                        referentiel_progress.concerne
                                                 FROM private.referentiel_progress(c.id) referentiel_progress(referentiel,
                                                                                                              score_fait,
                                                                                                              score_programme,
                                                                                                              completude,
                                                                                                              complet,
                                                                                                              concerne)) s
                                       ON true
                           GROUP BY c.id),
     labellisation AS (SELECT l.collectivite_id,
                              max(l.etoiles) FILTER (WHERE l.referentiel = 'cae'::referentiel) AS etoiles_cae,
                              max(l.etoiles) FILTER (WHERE l.referentiel = 'eci'::referentiel) AS etoiles_eci,
                              array_agg(l.etoiles)                                             AS etoiles_all
                       FROM public.labellisation l
                       GROUP BY l.collectivite_id),
     card AS (SELECT c.collectivite_id,
                     c.nom,
                     tc.type                                                                                   AS type_collectivite,
                     COALESCE(mc.insee::character varying, me.siren::character varying,
                              ''::character varying)                                                           AS code_siren_insee,
                     COALESCE(mc.region_code, me.region_code, ''::character varying)                           AS region_code,
                     COALESCE(mc.departement_code, me.departement_code,
                              ''::character varying)                                                           AS departement_code,
                     COALESCE(mc.population, me.population, 0)                                                 AS population,
                     COALESCE(l.etoiles_cae, 0)                                                                AS etoiles_cae,
                     COALESCE(l.etoiles_eci, 0)                                                                AS etoiles_eci,
                     COALESCE(l.etoiles_all, '{0}'::integer[])                                                 AS etoiles_all,
                     CASE
                       WHEN s.concerne_cae THEN COALESCE(s.score_fait_cae, 0::double precision)
                       ELSE NULL::double precision
                       END                                                                                   AS score_fait_cae,
                     CASE
                       WHEN s.concerne_eci THEN COALESCE(s.score_fait_eci, 0::double precision)
                       ELSE NULL::double precision
                       END                                                                                   AS score_fait_eci,
                     s.score_fait_min,
                     s.score_fait_max,
                     s.score_fait_sum,
                     CASE
                       WHEN s.concerne_cae THEN COALESCE(s.score_programme_cae, 0::double precision)
                       ELSE NULL::double precision
                       END                                                                                   AS score_programme_cae,
                     CASE
                       WHEN s.concerne_eci THEN COALESCE(s.score_programme_eci, 0::double precision)
                       ELSE NULL::double precision
                       END                                                                                   AS score_programme_eci,
                     s.score_programme_max,
                     s.score_programme_sum,
                     COALESCE(s.completude_cae, 0::double precision)                                           AS completude_cae,
                     COALESCE(s.completude_eci, 0::double precision)                                           AS completude_eci,
                     s.completude_min,
                     s.completude_max
              FROM named_collectivite c
                     LEFT JOIN meta_commune mc ON mc.collectivite_id = c.collectivite_id
                     LEFT JOIN meta_epci me ON me.collectivite_id = c.collectivite_id
                     LEFT JOIN type_collectivite tc ON tc.collectivite_id = c.collectivite_id
                     LEFT JOIN labellisation l ON l.collectivite_id = c.collectivite_id
                     LEFT JOIN referentiel_score s ON s.collectivite_id = c.collectivite_id
              WHERE NOT (c.collectivite_id IN (SELECT collectivite_test.collectivite_id
                                               FROM collectivite_test)))
SELECT card.collectivite_id,
       card.nom,
       card.type_collectivite,
       card.code_siren_insee,
       card.region_code,
       card.departement_code,
       card.population,
       card.etoiles_cae,
       card.etoiles_eci,
       card.etoiles_all,
       card.score_fait_cae,
       card.score_fait_eci,
       card.score_fait_min,
       card.score_fait_max,
       card.score_fait_sum,
       card.score_programme_cae,
       card.score_programme_eci,
       card.score_programme_max,
       card.score_programme_sum,
       card.completude_cae,
       card.completude_eci,
       card.completude_min,
       card.completude_max,
       pop.id      AS population_intervalle,
       comp_cae.id AS completude_cae_intervalle,
       comp_eci.id AS completude_eci_intervalle,
       comps.ids   AS completude_intervalles,
       fait_cae.id AS fait_cae_intervalle,
       fait_eci.id AS fait_eci_intervalle,
       scores.ids  AS fait_intervalles
FROM card
       LEFT JOIN LATERAL ( SELECT filtre_intervalle.id
                           FROM filtre_intervalle
                           WHERE filtre_intervalle.type = 'population'::collectivite_filtre_type
                             AND filtre_intervalle.intervalle @> card.population::numeric
                           LIMIT 1) pop ON true
       LEFT JOIN LATERAL ( SELECT filtre_intervalle.id
                           FROM filtre_intervalle
                           WHERE filtre_intervalle.type = 'remplissage'::collectivite_filtre_type
                             AND filtre_intervalle.intervalle @> (card.completude_cae * 100::double precision)::numeric
                           LIMIT 1) comp_cae ON true
       LEFT JOIN LATERAL ( SELECT filtre_intervalle.id
                           FROM filtre_intervalle
                           WHERE filtre_intervalle.type = 'remplissage'::collectivite_filtre_type
                             AND filtre_intervalle.intervalle @> (card.completude_eci * 100::double precision)::numeric
                           LIMIT 1) comp_eci ON true
       LEFT JOIN LATERAL ( SELECT array_agg(filtre_intervalle.id) AS ids
                           FROM filtre_intervalle
                           WHERE filtre_intervalle.type = 'remplissage'::collectivite_filtre_type
                             AND filtre_intervalle.intervalle @>
                                 (card.completude_min * 100::double precision)::numeric) comps ON true
       LEFT JOIN LATERAL ( SELECT filtre_intervalle.id
                           FROM filtre_intervalle
                           WHERE filtre_intervalle.type = 'score'::collectivite_filtre_type
                             AND filtre_intervalle.intervalle @> (card.score_fait_eci * 100::double precision)::numeric
                           LIMIT 1) fait_eci ON true
       LEFT JOIN LATERAL ( SELECT filtre_intervalle.id
                           FROM filtre_intervalle
                           WHERE filtre_intervalle.type = 'score'::collectivite_filtre_type
                             AND filtre_intervalle.intervalle @> (card.score_fait_cae * 100::double precision)::numeric
                           LIMIT 1) fait_cae ON true
       LEFT JOIN LATERAL ( SELECT array_agg(filtre_intervalle.id) AS ids
                           FROM filtre_intervalle
                           WHERE filtre_intervalle.type = 'score'::collectivite_filtre_type
                             AND filtre_intervalle.intervalle @>
                                 (card.score_fait_min * 100::double precision)::numeric) scores ON true
WHERE (card.collectivite_id IN (SELECT private_utilisateur_droit.collectivite_id
                                FROM private_utilisateur_droit
                                WHERE private_utilisateur_droit.active));
create unique index collectivite_card_collectivite_id
  on collectivite_card (collectivite_id);

-- function collectivite_card(axe)
create function collectivite_card(axe) returns collectivite_card
  stable
  language sql
BEGIN ATOMIC
SELECT card.*::collectivite_card AS card
FROM collectivite_card card
WHERE (card.collectivite_id = ($1).collectivite_id);
END;

-- type type_collectivite
create type type_collectivite as enum ('epci', 'EPCI', 'commune', 'syndicat');

-- table question
alter table question
  alter column types_collectivites_concernees
    set data type type_collectivite[]
    using array[types_collectivites_concernees]::type_collectivite[];

-- function private.collectivite_type(integer)
create function private.collectivite_type(collectivite_id integer) returns type_collectivite[]
  language sql
BEGIN ATOMIC
SELECT (
         CASE
           WHEN (t.* IS NOT NULL) THEN '{"EPCI"}'::text
           WHEN (e.* IS NULL) THEN '{"commune"}'::text
           WHEN ((e.nature = 'SMF'::nature) OR (e.nature = 'SIVOM'::nature) OR (e.nature = 'SMO'::nature) OR (e.nature = 'SIVU'::nature)) THEN '{"EPCI", "syndicat"}'::text
           ELSE '{"EPCI"}'::text
           END)::type_collectivite[] AS type_collectivite
FROM ((collectivite c
  LEFT JOIN epci e ON ((c.id = e.collectivite_id)))
  LEFT JOIN collectivite_test t ON ((c.id = t.collectivite_id)))
WHERE (c.id = collectivite_type.collectivite_id);
END;
comment on function private.collectivite_type(integer) is 'Renvoie la liste des `type_collectivite` correspondant à la collectivité';

-- view collectivite_identite
create view collectivite_identite(id, population, type, localisation) as
WITH meta_commune AS (SELECT com.collectivite_id,
                             private.population_buckets(ic.population) AS population,
                             CASE
                               WHEN ir.drom THEN '{"DOM"}'::text
                               ELSE '{"Metropole"}'::text
                               END                                   AS localisation
                      FROM commune com
                             LEFT JOIN imports.commune ic ON ic.code::text = com.code::text
                             LEFT JOIN imports.region ir ON ic.region_code::text = ir.code::text),
     meta_epci AS (SELECT epci.collectivite_id,
                          private.population_buckets(ib.population) AS population,
                          CASE
                            WHEN ir.drom THEN '{"DOM"}'::text
                            ELSE '{"Metropole"}'::text
                            END                                   AS localisation
                   FROM epci
                          LEFT JOIN imports.banatic ib ON ib.siren::text = epci.siren::text
                          LEFT JOIN imports.region ir ON ib.region_code::text = ir.code::text)
SELECT c.id,
       COALESCE(mc.population, me.population, '{}'::text[])                 AS population,
       COALESCE(private.collectivite_type(c.id), '{}'::type_collectivite[]) AS type,
       COALESCE(mc.localisation, me.localisation, '{}'::text)::text[]       AS localisation
FROM collectivite c
       LEFT JOIN meta_commune mc ON mc.collectivite_id = c.id
       LEFT JOIN meta_epci me ON me.collectivite_id = c.id;
comment on view collectivite_identite is 'L''identité d''une collectivité pour la personnalisation des référentiels, utilisée par le business.';

-- view question_display
create view question_display
    (id, action_ids, collectivite_id, thematique_id, type, thematique_nom, description,
     types_collectivites_concernees, formulation, ordonnancement, choix, population, localisation)
as
WITH actions AS (SELECT question_action.question_id,
                        array_agg(question_action.action_id) AS action_ids
                 FROM question_action
                 GROUP BY question_action.question_id),
     q AS (SELECT q_1.id,
                  a.action_ids,
                  q_1.thematique_id,
                  q_1.type,
                  t.nom   AS thematique_nom,
                  q_1.description,
                  q_1.types_collectivites_concernees,
                  q_1.formulation,
                  q_1.ordonnancement,
                  cx.json AS choix
           FROM question q_1
                  JOIN question_thematique t ON t.id::text = q_1.thematique_id::text
                  JOIN actions a ON q_1.id::text = a.question_id::text
                  LEFT JOIN LATERAL ( SELECT array_agg(json_build_object('id', c.id, 'label', c.formulation,
                                                                         'ordonnancement', c.ordonnancement)) AS json
                                      FROM question_choix c
                                      WHERE c.question_id::text = q_1.id::text) cx ON true)
SELECT q.id,
       q.action_ids,
       i.id AS collectivite_id,
       q.thematique_id,
       q.type,
       q.thematique_nom,
       q.description,
       q.types_collectivites_concernees,
       q.formulation,
       q.ordonnancement,
       q.choix,
       i.population,
       i.localisation
FROM q
       JOIN collectivite_identite i
            ON q.types_collectivites_concernees && i.type OR q.types_collectivites_concernees IS NULL
WHERE is_authenticated();
comment on view question_display is 'Questions avec leurs choix par collectivité pour l''affichage dans le client';

-- function evaluation.identite(integer)
create function evaluation.identite(collectivite_id integer) returns jsonb
  stable
  language sql
BEGIN ATOMIC
SELECT jsonb_build_object('population', ci.population, 'type', ci.type, 'localisation', ci.localisation) AS jsonb_build_object
FROM collectivite_identite ci
WHERE (ci.id = identite.collectivite_id);
END;
comment on function evaluation.identite(integer) is 'L''identité d''une collectivité pour le service d''évaluation.';

-- function labellisation.audit_personnalisation_payload(integer,boolean,text)
create function labellisation.audit_personnalisation_payload(audit_id integer, pre_audit boolean, scores_table text) returns jsonb
  language sql
BEGIN ATOMIC
WITH la AS (
  SELECT audit.id,
         audit.collectivite_id,
         audit.referentiel,
         audit.demande_id,
         audit.date_debut,
         audit.date_fin,
         audit.valide,
         audit.date_cnl,
         audit.valide_labellisation,
         audit.clos,
         demande.sujet
  FROM (labellisation.audit
    LEFT JOIN labellisation.demande ON ((audit.demande_id = demande.id)))
  WHERE (audit.id = audit_personnalisation_payload.audit_id)
), evaluation_payload AS (
  SELECT transaction_timestamp() AS "timestamp",
         audit_personnalisation_payload.audit_id AS audit_id,
         la.collectivite_id,
         la.referentiel,
         audit_personnalisation_payload.scores_table AS scores_table,
         to_jsonb(ep.*) AS payload
  FROM (la
    JOIN LATERAL labellisation.audit_evaluation_payload(ROW(la.id, la.collectivite_id, la.referentiel, la.demande_id, la.date_debut, la.date_fin, la.valide, la.date_cnl, la.valide_labellisation, la.clos), audit_personnalisation_payload.pre_audit, ((la.sujet IS NOT NULL) AND (la.sujet = ANY (ARRAY['labellisation'::labellisation.sujet_demande, 'labellisation_cot'::labellisation.sujet_demande])))) ep(referentiel, statuts, consequences) ON (true))
), personnalisation_payload AS (
  SELECT transaction_timestamp() AS "timestamp",
         la.collectivite_id,
         ''::text AS consequences_table,
         jsonb_build_object('identite', ( SELECT evaluation.identite(la.collectivite_id) AS identite), 'regles', ( SELECT evaluation.service_regles() AS service_regles), 'reponses', ( SELECT labellisation.json_reponses_at(la.collectivite_id,
                                                                                                                                                                                                                              CASE
                                                                                                                                                                                                                                WHEN audit_personnalisation_payload.pre_audit THEN la.date_debut
                                                                                                                                                                                                                                WHEN ((la.sujet IS NOT NULL) AND (la.sujet = ANY (ARRAY['labellisation'::labellisation.sujet_demande, 'labellisation_cot'::labellisation.sujet_demande]))) THEN la.date_cnl
                                                                                                                                                                                                                                ELSE la.date_fin
                                                                                                                                                                                                                                END) AS json_reponses_at)) AS payload,
         ( SELECT array_agg(ep.*) AS array_agg
           FROM evaluation_payload ep) AS evaluation_payloads
  FROM la
)
SELECT to_jsonb(pp.*) AS to_jsonb
FROM personnalisation_payload pp;
END;

-- function labellisation.evaluate_audit_statuts(integer,boolean,character varying)
create function labellisation.evaluate_audit_statuts(audit_id integer, pre_audit boolean, scores_table character varying, OUT request_id bigint) returns bigint
  security definer
  language sql
BEGIN ATOMIC
SELECT post.post
FROM ((evaluation.current_service_configuration() conf(evaluation_endpoint, personnalisation_endpoint, created_at)
  JOIN labellisation.audit_personnalisation_payload(evaluate_audit_statuts.audit_id, evaluate_audit_statuts.pre_audit, (evaluate_audit_statuts.scores_table)::text) pp(pp) ON (true))
  JOIN LATERAL net.http_post((conf.personnalisation_endpoint)::text, pp.pp) post(post) ON (true))
WHERE (conf.* IS NOT NULL);
END;

-- view collectivite_carte_identite
create view collectivite_carte_identite
    (collectivite_id, nom, type_collectivite, code_siren_insee, region_name, departement_name,
     population_source, population_totale, is_cot)
as
WITH meta_commune AS (SELECT com.collectivite_id,
                             ic.population,
                             'Insee Populations légales 2020 parues 29/12/2022'::text AS population_source,
                             ic.code                                                  AS insee,
                             ir.libelle                                               AS region_name,
                             id.libelle                                               AS departement_name
                      FROM commune com
                             LEFT JOIN imports.commune ic ON ic.code::text = com.code::text
                             LEFT JOIN imports.region ir ON ic.region_code::text = ir.code::text
                             LEFT JOIN imports.departement id ON ic.departement_code::text = id.code::text),
     meta_epci AS (SELECT epci.collectivite_id,
                          ib.population,
                          'BANATIC 2023'::text AS population_source,
                          ib.siren,
                          ir.libelle           AS region_name,
                          id.libelle           AS departement_name
                   FROM epci
                          LEFT JOIN imports.banatic ib ON ib.siren::text = epci.siren::text
                          LEFT JOIN imports.region ir ON ib.region_code::text = ir.code::text
                          LEFT JOIN imports.departement id ON ib.departement_code::text = id.code::text),
     type_collectivite AS (SELECT c_1.id                     AS collectivite_id,
                                  CASE
                                    WHEN (c_1.id IN (SELECT commune.collectivite_id
                                                     FROM commune)) THEN 'commune'::text
                                    WHEN e.nature = 'SMF'::nature OR e.nature = 'SIVOM'::nature OR
                                         e.nature = 'SMO'::nature OR e.nature = 'SIVU'::nature THEN 'syndicat'::text
                                    ELSE 'EPCI'::text
                                    END::type_collectivite AS type
                           FROM collectivite c_1
                                  LEFT JOIN epci e ON c_1.id = e.collectivite_id)
SELECT c.collectivite_id,
       c.nom,
       tc.type                                                                                   AS type_collectivite,
       COALESCE(mc.insee::character varying, me.siren::character varying, ''::character varying) AS code_siren_insee,
       COALESCE(mc.region_name, me.region_name, ''::character varying)                           AS region_name,
       COALESCE(mc.departement_name, me.departement_name, ''::character varying)                 AS departement_name,
       COALESCE(mc.population_source, me.population_source)                                      AS population_source,
       COALESCE(mc.population, me.population, 0)                                                 AS population_totale,
       COALESCE(cot.actif, false)                                                                AS is_cot
FROM named_collectivite c
       LEFT JOIN meta_commune mc ON mc.collectivite_id = c.collectivite_id
       LEFT JOIN meta_epci me ON me.collectivite_id = c.collectivite_id
       LEFT JOIN type_collectivite tc ON tc.collectivite_id = c.collectivite_id
       LEFT JOIN cot ON cot.collectivite_id = c.collectivite_id;
comment on view collectivite_carte_identite is 'Le contenu de la carte d''identité de la collectivité telle qu''affichée dans le client.';

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
WHERE is_service_role()
ORDER BY c.collectivite_id;
comment on view retool_completude is 'Completude computed from client scores';

-- materialized view labellisation.export_score_audit
create materialized view labellisation.export_score_audit as
WITH score_audit AS (WITH last_audit AS (WITH last_audit_date AS (SELECT audit.collectivite_id,
                                                                         audit.referentiel,
                                                                         max(audit.date_debut) AS date_debut
                                                                  FROM labellisation.audit
                                                                  WHERE audit.date_debut IS NOT NULL
                                                                  GROUP BY audit.collectivite_id, audit.referentiel)
                                         SELECT a_1.id,
                                                a_1.collectivite_id,
                                                a_1.referentiel,
                                                a_1.demande_id,
                                                a_1.date_debut,
                                                a_1.date_fin,
                                                a_1.valide
                                         FROM labellisation.audit a_1
                                                JOIN last_audit_date l ON a_1.collectivite_id = l.collectivite_id AND
                                                                          a_1.date_debut = l.date_debut AND
                                                                          a_1.referentiel = l.referentiel),
                          table_scores AS (SELECT a_1.id AS audit_id,
                                                  ccs.referentiel,
                                                  ccs.action_id,
                                                  ccs.concerne,
                                                  ccs.desactive,
                                                  ccs.point_fait,
                                                  ccs.point_pas_fait,
                                                  ccs.point_potentiel,
                                                  ccs.point_programme,
                                                  ccs.point_referentiel,
                                                  ccs.total_taches_count,
                                                  ccs.point_non_renseigne,
                                                  ccs.point_potentiel_perso,
                                                  ccs.completed_taches_count,
                                                  ccs.fait_taches_avancement,
                                                  ccs.pas_fait_taches_avancement,
                                                  ccs.programme_taches_avancement,
                                                  ccs.pas_concerne_taches_avancement
                                           FROM last_audit a_1
                                                  JOIN client_scores cs
                                                       ON cs.collectivite_id = a_1.collectivite_id AND
                                                          cs.referentiel = a_1.referentiel
                                                  JOIN LATERAL private.convert_client_scores(cs.scores) ccs(referentiel,
                                                                                                            action_id,
                                                                                                            concerne,
                                                                                                            desactive,
                                                                                                            point_fait,
                                                                                                            point_pas_fait,
                                                                                                            point_potentiel,
                                                                                                            point_programme,
                                                                                                            point_referentiel,
                                                                                                            total_taches_count,
                                                                                                            point_non_renseigne,
                                                                                                            point_potentiel_perso,
                                                                                                            completed_taches_count,
                                                                                                            fait_taches_avancement,
                                                                                                            pas_fait_taches_avancement,
                                                                                                            programme_taches_avancement,
                                                                                                            pas_concerne_taches_avancement)
                                                       ON true
                                           WHERE a_1.date_fin IS NULL
                                           UNION
                                           SELECT a_1.id AS audit_id,
                                                  ccs.referentiel,
                                                  ccs.action_id,
                                                  ccs.concerne,
                                                  ccs.desactive,
                                                  ccs.point_fait,
                                                  ccs.point_pas_fait,
                                                  ccs.point_potentiel,
                                                  ccs.point_programme,
                                                  ccs.point_referentiel,
                                                  ccs.total_taches_count,
                                                  ccs.point_non_renseigne,
                                                  ccs.point_potentiel_perso,
                                                  ccs.completed_taches_count,
                                                  ccs.fait_taches_avancement,
                                                  ccs.pas_fait_taches_avancement,
                                                  ccs.programme_taches_avancement,
                                                  ccs.pas_concerne_taches_avancement
                                           FROM last_audit a_1
                                                  JOIN post_audit_scores pas
                                                       ON pas.collectivite_id = a_1.collectivite_id AND
                                                          pas.referentiel = a_1.referentiel
                                                  JOIN LATERAL private.convert_client_scores(pas.scores) ccs(referentiel,
                                                                                                             action_id,
                                                                                                             concerne,
                                                                                                             desactive,
                                                                                                             point_fait,
                                                                                                             point_pas_fait,
                                                                                                             point_potentiel,
                                                                                                             point_programme,
                                                                                                             point_referentiel,
                                                                                                             total_taches_count,
                                                                                                             point_non_renseigne,
                                                                                                             point_potentiel_perso,
                                                                                                             completed_taches_count,
                                                                                                             fait_taches_avancement,
                                                                                                             pas_fait_taches_avancement,
                                                                                                             programme_taches_avancement,
                                                                                                             pas_concerne_taches_avancement)
                                                       ON true
                                           WHERE a_1.date_fin IS NOT NULL)
                     SELECT a.collectivite_id,
                            a.referentiel,
                            a.date_fin,
                            CASE
                              WHEN s.point_potentiel = 0.0::double precision
                                THEN s.fait_taches_avancement / s.total_taches_count
                              ELSE s.point_fait / s.point_potentiel
                              END           AS realise,
                            CASE
                              WHEN s.point_potentiel = 0.0::double precision
                                THEN s.programme_taches_avancement / s.total_taches_count
                              ELSE s.point_programme / s.point_potentiel
                              END           AS programme,
                            s.point_potentiel AS points
                     FROM last_audit a
                            JOIN table_scores s ON s.audit_id = a.id AND s.action_id::text = a.referentiel::text),
     score_audit_eci AS (SELECT score_audit.collectivite_id,
                                score_audit.referentiel,
                                score_audit.date_fin,
                                score_audit.realise,
                                score_audit.programme,
                                score_audit.points
                         FROM score_audit
                         WHERE score_audit.referentiel = 'eci'::referentiel),
     score_audit_cae AS (SELECT score_audit.collectivite_id,
                                score_audit.referentiel,
                                score_audit.date_fin,
                                score_audit.realise,
                                score_audit.programme,
                                score_audit.points
                         FROM score_audit
                         WHERE score_audit.referentiel = 'cae'::referentiel),
     collectivite_active AS (SELECT named_collectivite.collectivite_id
                             FROM named_collectivite
                                    JOIN private_utilisateur_droit ON named_collectivite.collectivite_id =
                                                                      private_utilisateur_droit.collectivite_id
                             WHERE private_utilisateur_droit.active
                               AND NOT (named_collectivite.collectivite_id IN (SELECT collectivite_test.collectivite_id
                                                                               FROM collectivite_test))
                             GROUP BY named_collectivite.collectivite_id)
SELECT cci.nom           AS collectivite,
       cci.region_name   AS region,
       cot.* IS NOT NULL AS cot,
       nc.nom            AS signataire,
       sae.realise       AS realise_eci,
       sae.programme     AS programme_eci,
       sae.points        AS points_eci,
       sae.date_fin      AS date_cloture_eci,
       sac.realise       AS realise_cae,
       sac.programme     AS programme_cae,
       sac.points        AS points_cae,
       sac.date_fin      AS date_cloture_cae
FROM collectivite_carte_identite cci
       JOIN collectivite_active ca ON cci.collectivite_id = ca.collectivite_id
       LEFT JOIN cot ON cci.collectivite_id = cot.collectivite_id
       LEFT JOIN named_collectivite nc ON cot.signataire = nc.collectivite_id
       LEFT JOIN score_audit_eci sae ON cci.collectivite_id = sae.collectivite_id
       LEFT JOIN score_audit_cae sac ON cci.collectivite_id = sac.collectivite_id
ORDER BY cci.nom;

-- view export_score_audit
create view export_score_audit
    (collectivite, region, cot, signataire, realise_eci, programme_eci, points_eci, date_cloture_eci,
     realise_cae, programme_cae, points_cae, date_cloture_cae)
as
SELECT export_score_audit.collectivite,
       export_score_audit.region,
       export_score_audit.cot,
       export_score_audit.signataire,
       export_score_audit.realise_eci,
       export_score_audit.programme_eci,
       export_score_audit.points_eci,
       export_score_audit.date_cloture_eci,
       export_score_audit.realise_cae,
       export_score_audit.programme_cae,
       export_score_audit.points_cae,
       export_score_audit.date_cloture_cae
FROM labellisation.export_score_audit
WHERE is_service_role();

-- materialized view stats.collectivite
create materialized view stats.collectivite as
WITH meta_commune AS (SELECT com.collectivite_id,
                             ic.population,
                             ic.code      AS insee,
                             ir_1.code    AS region_code,
                             ir_1.libelle AS region_name,
                             id_1.code    AS departement_code,
                             id_1.libelle AS departement_name
                      FROM commune com
                             LEFT JOIN imports.commune ic ON ic.code::text = com.code::text
                             LEFT JOIN imports.region ir_1 ON ic.region_code::text = ir_1.code::text
                             LEFT JOIN imports.departement id_1 ON ic.departement_code::text = id_1.code::text),
     meta_epci AS (SELECT epci.collectivite_id,
                          ib.population,
                          ib.siren,
                          ib.nature,
                          ir_1.code    AS region_code,
                          ir_1.libelle AS region_name,
                          id_1.code    AS departement_code,
                          id_1.libelle AS departement_name
                   FROM epci
                          LEFT JOIN imports.banatic ib ON ib.siren::text = epci.siren::text
                          LEFT JOIN imports.region ir_1 ON ib.region_code::text = ir_1.code::text
                          LEFT JOIN imports.departement id_1 ON ib.departement_code::text = id_1.code::text),
     type_collectivite AS (SELECT c.id                       AS collectivite_id,
                                  CASE
                                    WHEN (c.id IN (SELECT commune.collectivite_id
                                                   FROM commune)) THEN 'commune'::text
                                    WHEN e.nature = 'SMF'::nature OR e.nature = 'SIVOM'::nature OR
                                         e.nature = 'SMO'::nature OR e.nature = 'SIVU'::nature THEN 'syndicat'::text
                                    ELSE 'EPCI'::text
                                    END::type_collectivite AS type
                           FROM collectivite c
                                  LEFT JOIN epci e ON c.id = e.collectivite_id),
     info AS (SELECT c.collectivite_id,
                     c.nom,
                     tc.type                                                                                   AS type_collectivite,
                     COALESCE(me.nature::character varying, tc.type::character varying)                        AS nature_collectivite,
                     COALESCE(mc.insee::character varying, me.siren::character varying,
                              ''::character varying)                                                           AS code_siren_insee,
                     COALESCE(mc.region_name, me.region_name, ''::character varying)                           AS region_name,
                     COALESCE(mc.region_code, me.region_code, ''::character varying)                           AS region_code,
                     COALESCE(mc.departement_name, me.departement_name,
                              ''::character varying)                                                           AS departement_name,
                     COALESCE(mc.departement_code, me.departement_code,
                              ''::character varying)                                                           AS departement_code,
                     COALESCE(mc.population, me.population, 0)                                                 AS population_totale
              FROM named_collectivite c
                     LEFT JOIN meta_commune mc ON mc.collectivite_id = c.collectivite_id
                     LEFT JOIN meta_epci me ON me.collectivite_id = c.collectivite_id
                     LEFT JOIN type_collectivite tc ON tc.collectivite_id = c.collectivite_id
              WHERE NOT (c.collectivite_id IN (SELECT t.collectivite_id
                                               FROM collectivite_test t)))
SELECT info.collectivite_id,
       info.nom,
       info.type_collectivite,
       info.nature_collectivite,
       info.code_siren_insee,
       info.region_name,
       info.region_code,
       info.departement_name,
       info.departement_code,
       info.population_totale,
       id.code AS departement_iso_3166,
       ir.code AS region_iso_3166
FROM info
       LEFT JOIN stats.iso_3166 id ON id.nom::text = info.departement_name::text
       LEFT JOIN stats.iso_3166 ir ON ir.nom::text = info.region_name::text;
comment on materialized view stats.collectivite is 'Les collectivités liées aus données des référentiels, comporte uniquement les collectivités actives.';

-- materialized view stats.collectivite_labellisation
create materialized view stats.collectivite_labellisation as
SELECT c.collectivite_id,
       c.nom,
       c.type_collectivite,
       c.nature_collectivite,
       c.code_siren_insee,
       c.region_name,
       c.region_code,
       c.departement_name,
       c.departement_code,
       c.population_totale,
       c.departement_iso_3166,
       c.region_iso_3166,
       l.referentiel,
       l.obtenue_le,
       l.annee,
       l.etoiles,
       l.score_realise,
       l.score_programme
FROM labellisation l
       JOIN stats.collectivite c USING (collectivite_id);
comment on materialized view stats.collectivite_labellisation is 'Les collectivités liées aux données historiques de labellisation.';

-- materialized view stats.collectivite_utilisateur
create materialized view stats.collectivite_utilisateur as
WITH utilisateurs AS (SELECT private_utilisateur_droit.collectivite_id,
                             count(*)                                  AS utilisateurs,
                             min(private_utilisateur_droit.created_at) AS date_activation
                      FROM private_utilisateur_droit
                      WHERE private_utilisateur_droit.active
                      GROUP BY private_utilisateur_droit.collectivite_id)
SELECT c.collectivite_id,
       c.nom,
       c.type_collectivite,
       c.nature_collectivite,
       c.code_siren_insee,
       c.region_name,
       c.region_code,
       c.departement_name,
       c.departement_code,
       c.population_totale,
       c.departement_iso_3166,
       c.region_iso_3166,
       u.utilisateurs,
       u.date_activation
FROM utilisateurs u
       JOIN stats.collectivite c USING (collectivite_id);
comment on materialized view stats.collectivite_utilisateur is 'Les collectivités liées aux données utilisateurs.';

-- materialized view stats.evolution_activation
create materialized view stats.evolution_activation as
SELECT m.first_day                              AS mois,
       (SELECT count(*) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation >= m.first_day
          AND cu.date_activation <= m.last_day) AS activations,
       (SELECT count(*) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total_activations
FROM stats.monthly_bucket m;

-- materialized view stats.collectivite_action_statut
create materialized view stats.collectivite_action_statut as
WITH statut_count AS (SELECT action_statut.collectivite_id,
                             count(*) AS count
                      FROM action_statut
                      GROUP BY action_statut.collectivite_id)
SELECT c.collectivite_id,
       c.nom,
       c.type_collectivite,
       c.nature_collectivite,
       c.code_siren_insee,
       c.region_name,
       c.region_code,
       c.departement_name,
       c.departement_code,
       c.population_totale,
       c.departement_iso_3166,
       c.region_iso_3166,
       COALESCE(statut_count.count, 0::bigint) AS statuts
FROM statut_count
       JOIN stats.collectivite c USING (collectivite_id);

-- materialized view stats.rattachement
create materialized view stats.rattachement as
SELECT c.collectivite_id,
       c.nom,
       c.type_collectivite,
       c.nature_collectivite,
       c.code_siren_insee,
       c.region_name,
       c.region_code,
       c.departement_name,
       c.departement_code,
       c.population_totale,
       c.departement_iso_3166,
       c.region_iso_3166,
       md5(pud.user_id::character varying::text)        AS utilisateur,
       pud.created_at                                   AS creation,
       pud.niveau_acces,
       pcm.fonction                                     AS membre_fonction,
       pcm.champ_intervention @> '{eci}'::referentiel[] AS membre_champ_intervention_eci,
       pcm.champ_intervention @> '{cae}'::referentiel[] AS membre_champ_intervention_cae
FROM private_utilisateur_droit pud
       JOIN stats.collectivite c ON pud.collectivite_id = c.collectivite_id
       LEFT JOIN private_collectivite_membre pcm
                 ON pud.user_id = pcm.user_id AND pud.collectivite_id = pcm.collectivite_id
WHERE NOT (pud.collectivite_id IN (SELECT collectivite_test.collectivite_id
                                   FROM collectivite_test))
  AND pud.active;

-- materialized view stats.utilisateur
create materialized view stats.utilisateur as
SELECT md5(pud.user_id::character varying::text) AS utilisateur,
       min(pud.created_at)                       AS premier_rattachement
FROM private_utilisateur_droit pud
       JOIN stats.collectivite c ON pud.collectivite_id = c.collectivite_id
       LEFT JOIN private_collectivite_membre pcm
                 ON pud.user_id = pcm.user_id AND pud.collectivite_id = pcm.collectivite_id
WHERE NOT (pud.collectivite_id IN (SELECT collectivite_test.collectivite_id
                                   FROM collectivite_test))
  AND pud.active
GROUP BY pud.user_id;

-- materialized view stats.evolution_utilisateur
create materialized view stats.evolution_utilisateur as
SELECT m.first_day                                  AS mois,
       (SELECT count(*) AS count
        FROM stats.utilisateur u
        WHERE u.premier_rattachement >= m.first_day
          AND u.premier_rattachement <= m.last_day) AS utilisateurs,
       (SELECT count(*) AS count
        FROM stats.utilisateur u
        WHERE u.premier_rattachement <= m.last_day) AS total_utilisateurs
FROM stats.monthly_bucket m;

-- view stats_evolution_utilisateur
create view stats_evolution_utilisateur(mois, utilisateurs, total_utilisateurs) as
SELECT evolution_utilisateur.mois,
       evolution_utilisateur.utilisateurs,
       evolution_utilisateur.total_utilisateurs
FROM stats.evolution_utilisateur;

-- materialized view stats.connection
create materialized view stats.connection as
WITH utilisateur AS (SELECT DISTINCT pud.user_id
                     FROM private_utilisateur_droit pud
                            JOIN stats.collectivite c ON pud.collectivite_id = c.collectivite_id
                     WHERE NOT (pud.collectivite_id IN (SELECT collectivite_test.collectivite_id
                                                        FROM collectivite_test))
                       AND pud.active),
     event AS (SELECT audit_log_entries.payload ->> 'actor_id'::text AS user_id,
                      audit_log_entries.created_at::date             AS created_at
               FROM utilisateur u
                      JOIN auth.audit_log_entries
                           ON ((audit_log_entries.payload ->> 'actor_id'::text)::uuid) = u.user_id
               WHERE (audit_log_entries.payload ->> 'action'::text) = 'login'::text
                  OR (audit_log_entries.payload ->> 'action'::text) = 'token_refreshed'::text
               ORDER BY (audit_log_entries.created_at::date) DESC)
SELECT md5(event.user_id) AS utilisateur,
       event.created_at
FROM event
GROUP BY event.created_at, event.user_id
ORDER BY event.created_at DESC;
comment on materialized view stats.connection is 'Les connection utilisateurs reconstituée à partir des événements `login` et `token_refreshed` avec maximum d''un événement par utilisateur par jour.';

-- materialized view stats.evolution_connection
create materialized view stats.evolution_connection as
SELECT m.first_day                        AS mois,
       (SELECT count(*) AS count
        FROM stats.connection c
        WHERE c.created_at >= m.first_day
          AND c.created_at <= m.last_day) AS connections,
       (SELECT count(DISTINCT c.utilisateur) AS count
        FROM stats.connection c
        WHERE c.created_at >= m.first_day
          AND c.created_at <= m.last_day) AS utilisateurs_uniques,
       (SELECT count(*) AS count
        FROM stats.connection c
        WHERE c.created_at <= m.last_day) AS total_connections,
       (SELECT count(DISTINCT c.utilisateur) AS count
        FROM stats.connection c
        WHERE c.created_at <= m.last_day) AS total_utilisateurs_uniques
FROM stats.monthly_bucket m;

-- materialized view stats.carte_collectivite_active
create materialized view stats.carte_collectivite_active as
SELECT c.collectivite_id,
       c.nom,
       c.type_collectivite,
       c.nature_collectivite,
       c.code_siren_insee,
       c.region_name,
       c.region_code,
       c.departement_name,
       c.departement_code,
       c.population_totale,
       geo.geojson
FROM stats.collectivite_active a
       JOIN stats.collectivite c USING (collectivite_id)
       JOIN stats.collectivite_geojson geo ON geo.siren_insee = c.code_siren_insee::text;
comment on materialized view stats.carte_collectivite_active is 'Les collectivités actives avec leurs contours.';

-- materialized view stats.carte_epci_par_departement
create materialized view stats.carte_epci_par_departement as
WITH epcis_departement AS (SELECT c.departement_code                                                     AS insee,
                                  count(*)                                                               AS total,
                                  count(*)
                                  FILTER (WHERE (c.collectivite_id IN (SELECT collectivite_active.collectivite_id
                                                                       FROM stats.collectivite_active))) AS actives
                           FROM stats.collectivite c
                           WHERE stats.is_fiscalite_propre(c.nature_collectivite)
                           GROUP BY c.departement_code)
SELECT epcis_departement.insee,
       departement_geojson.libelle,
       epcis_departement.total,
       epcis_departement.actives,
       departement_geojson.geojson
FROM epcis_departement
       JOIN stats.departement_geojson USING (insee);

-- view stats_carte_epci_par_departement
create view stats_carte_epci_par_departement(insee, libelle, total, actives, geojson) as
SELECT carte_epci_par_departement.insee,
       carte_epci_par_departement.libelle,
       carte_epci_par_departement.total,
       carte_epci_par_departement.actives,
       carte_epci_par_departement.geojson
FROM stats.carte_epci_par_departement;

-- materialized view stats.collectivite_plan_action
create materialized view stats.collectivite_plan_action as
WITH fa AS (SELECT f.collectivite_id,
                   count(*) AS count
            FROM fiche_action f
            GROUP BY f.collectivite_id),
     pa AS (SELECT p.collectivite_id,
                   count(*) AS count
            FROM axe p
            WHERE p.parent IS NULL
            GROUP BY p.collectivite_id)
SELECT c.collectivite_id,
       c.nom,
       c.type_collectivite,
       c.nature_collectivite,
       c.code_siren_insee,
       c.region_name,
       c.region_code,
       c.departement_name,
       c.departement_code,
       c.population_totale,
       c.departement_iso_3166,
       c.region_iso_3166,
       COALESCE(fa.count, 0::bigint) AS fiches,
       COALESCE(pa.count, 0::bigint) AS plans
FROM stats.collectivite c
       LEFT JOIN pa ON pa.collectivite_id = c.collectivite_id
       LEFT JOIN fa ON pa.collectivite_id = fa.collectivite_id
ORDER BY (COALESCE(fa.count, 0::bigint)) DESC;

-- materialized view stats.locales_pourcentage_completude
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
       COALESCE(eci.completed_taches_count::double precision / eci.total_taches_count::double precision *
                100::double precision, 0::double precision) AS completude_eci,
       COALESCE(cae.completed_taches_count::double precision / cae.total_taches_count::double precision *
                100::double precision, 0::double precision) AS completude_cae
FROM stats.collectivite c
       LEFT JOIN eci ON eci.collectivite_id = c.collectivite_id
       LEFT JOIN cae ON cae.collectivite_id = c.collectivite_id
ORDER BY c.collectivite_id;

-- materialized view stats.locales_tranche_completude
create materialized view stats.locales_tranche_completude as
WITH bounds AS (SELECT unnest('{0,20,50,80,100}'::numeric[]) AS bound),
     ranges AS (SELECT numrange(lower.bound, upper.bound) AS range,
                       lower.bound                        AS lower_bound,
                       upper.bound                        AS upper_bound
                FROM bounds lower
                       LEFT JOIN LATERAL ( SELECT b.bound
                                           FROM bounds b
                                           WHERE b.bound > lower.bound
                                           LIMIT 1) upper ON true)
SELECT r.lower_bound,
       r.upper_bound,
       NULL::character varying(2) AS code_region,
       NULL::character varying(2) AS code_departement,
       in_range.eci,
       in_range.cae
FROM ranges r
       LEFT JOIN LATERAL ( SELECT count(*) FILTER (WHERE r.range @> c.completude_eci::numeric) AS eci,
                                  count(*) FILTER (WHERE r.range @> c.completude_cae::numeric) AS cae
                           FROM stats.locales_pourcentage_completude c) in_range ON true
UNION ALL
SELECT ranges.lower_bound,
       ranges.upper_bound,
       r.code                  AS code_region,
       NULL::character varying AS code_departement,
       in_range.eci,
       in_range.cae
FROM imports.region r
       JOIN ranges ON true
       LEFT JOIN LATERAL ( SELECT count(*) FILTER (WHERE ranges.range @> c.completude_eci::numeric AND
                                                         c.region_code::text = r.code::text) AS eci,
                                  count(*) FILTER (WHERE ranges.range @> c.completude_cae::numeric AND
                                                         c.region_code::text = r.code::text) AS cae
                           FROM stats.locales_pourcentage_completude c) in_range ON true
UNION ALL
SELECT ranges.lower_bound,
       ranges.upper_bound,
       NULL::character varying AS code_region,
       d.code                  AS code_departement,
       in_range.eci,
       in_range.cae
FROM imports.departement d
       JOIN ranges ON true
       LEFT JOIN LATERAL ( SELECT count(*) FILTER (WHERE ranges.range @> c.completude_eci::numeric AND
                                                         c.departement_code::text = d.code::text) AS eci,
                                  count(*) FILTER (WHERE ranges.range @> c.completude_cae::numeric AND
                                                         c.departement_code::text = d.code::text) AS cae
                           FROM stats.locales_pourcentage_completude c) in_range ON true;

-- view stats_locales_tranche_completude
create view stats_locales_tranche_completude(lower_bound, upper_bound, code_region, code_departement, eci, cae) as
SELECT locales_tranche_completude.lower_bound,
       locales_tranche_completude.upper_bound,
       locales_tranche_completude.code_region,
       locales_tranche_completude.code_departement,
       locales_tranche_completude.eci,
       locales_tranche_completude.cae
FROM stats.locales_tranche_completude;

-- materialized view stats.locales_engagement_collectivite
create materialized view stats.locales_engagement_collectivite as
SELECT c.collectivite_id,
       c.region_code              AS code_region,
       c.departement_code         AS code_departement,
       COALESCE(cot.actif, false) AS cot,
       COALESCE(eci.etoiles, 0)   AS etoiles_eci,
       COALESCE(cae.etoiles, 0)   AS etoiles_cae
FROM stats.collectivite c
       LEFT JOIN cot USING (collectivite_id)
       LEFT JOIN LATERAL ( SELECT l.etoiles
                           FROM labellisation l
                           WHERE l.collectivite_id = c.collectivite_id
                             AND l.referentiel = 'eci'::referentiel
                           ORDER BY l.obtenue_le DESC
                           LIMIT 1) eci ON true
       LEFT JOIN LATERAL ( SELECT l.etoiles
                           FROM labellisation l
                           WHERE l.collectivite_id = c.collectivite_id
                             AND l.referentiel = 'cae'::referentiel
                           ORDER BY l.obtenue_le DESC
                           LIMIT 1) cae ON true;

-- view stats_locales_engagement_collectivite
create view stats_locales_engagement_collectivite
    (collectivite_id, code_region, code_departement, cot, etoiles_eci, etoiles_cae) as
SELECT locales_engagement_collectivite.collectivite_id,
       locales_engagement_collectivite.code_region,
       locales_engagement_collectivite.code_departement,
       locales_engagement_collectivite.cot,
       locales_engagement_collectivite.etoiles_eci,
       locales_engagement_collectivite.etoiles_cae
FROM stats.locales_engagement_collectivite;

-- materialized view stats.locales_evolution_nombre_utilisateur_par_collectivite
create materialized view stats.locales_evolution_nombre_utilisateur_par_collectivite as
WITH membres AS (SELECT c.*::stats.collectivite                                                                   AS collectivite,
                        mb.first_day                                                                              AS mois,
                        COALESCE(count(*) FILTER (WHERE pud.active AND pud.created_at <= mb.last_day),
                                 0::bigint)                                                                       AS nombre
                 FROM stats.monthly_bucket mb
                        JOIN stats.collectivite c ON true
                        LEFT JOIN private_utilisateur_droit pud USING (collectivite_id)
                 WHERE pud.active
                 GROUP BY c.*, mb.first_day)
SELECT membres.mois,
       NULL::character varying(2)                                                  AS code_region,
       NULL::character varying(2)                                                  AS code_departement,
       COALESCE(avg(membres.nombre) FILTER (WHERE membres.nombre > 0), 0::numeric) AS moyen,
       COALESCE(max(membres.nombre) FILTER (WHERE membres.nombre > 0), 0::bigint)  AS maximum,
       COALESCE(percentile_cont(0.5::double precision) WITHIN GROUP (ORDER BY (membres.nombre::double precision))
                FILTER (WHERE membres.nombre > 0), 0::double precision)            AS median
FROM membres
GROUP BY membres.mois
UNION ALL
SELECT membres.mois,
       (membres.collectivite).region_code                                          AS code_region,
       NULL::character varying                                                     AS code_departement,
       COALESCE(avg(membres.nombre) FILTER (WHERE membres.nombre > 0), 0::numeric) AS moyen,
       COALESCE(max(membres.nombre) FILTER (WHERE membres.nombre > 0), 0::bigint)  AS maximum,
       COALESCE(percentile_cont(0.5::double precision) WITHIN GROUP (ORDER BY (membres.nombre::double precision))
                FILTER (WHERE membres.nombre > 0), 0::double precision)            AS median
FROM membres
GROUP BY membres.mois, ((membres.collectivite).region_code)
UNION ALL
SELECT membres.mois,
       NULL::character varying                                                     AS code_region,
       (membres.collectivite).departement_code                                     AS code_departement,
       COALESCE(avg(membres.nombre) FILTER (WHERE membres.nombre > 0), 0::numeric) AS moyen,
       COALESCE(max(membres.nombre) FILTER (WHERE membres.nombre > 0), 0::bigint)  AS maximum,
       COALESCE(percentile_cont(0.5::double precision) WITHIN GROUP (ORDER BY (membres.nombre::double precision))
                FILTER (WHERE membres.nombre > 0), 0::double precision)            AS median
FROM membres
GROUP BY membres.mois, ((membres.collectivite).departement_code);

-- view stats_locales_evolution_nombre_utilisateur_par_collectivite
create view stats_locales_evolution_nombre_utilisateur_par_collectivite(mois, code_region, code_departement, moyen, maximum, median) as
SELECT locales_evolution_nombre_utilisateur_par_collectivite.mois,
       locales_evolution_nombre_utilisateur_par_collectivite.code_region,
       locales_evolution_nombre_utilisateur_par_collectivite.code_departement,
       locales_evolution_nombre_utilisateur_par_collectivite.moyen,
       locales_evolution_nombre_utilisateur_par_collectivite.maximum,
       locales_evolution_nombre_utilisateur_par_collectivite.median
FROM stats.locales_evolution_nombre_utilisateur_par_collectivite;

-- materialized view stats.locales_evolution_utilisateur
create materialized view stats.locales_evolution_utilisateur as
WITH premier_rattachements AS (SELECT u.premier_rattachement::date AS date,
                                      pud.user_id,
                                      pud.collectivite_id,
                                      c.region_code,
                                      c.departement_code
                               FROM stats.utilisateur u
                                      JOIN private_utilisateur_droit pud ON md5(pud.user_id::text) = u.utilisateur
                                      JOIN stats.collectivite c ON c.collectivite_id = pud.collectivite_id
                               WHERE pud.active)
SELECT m.first_day                   AS mois,
       NULL::character varying(2)    AS code_region,
       NULL::character varying(2)    AS code_departement,
       (SELECT count(DISTINCT pr.user_id) AS count
        FROM premier_rattachements pr
        WHERE pr.date >= m.first_day
          AND pr.date <= m.last_day) AS utilisateurs,
       (SELECT count(DISTINCT pr.user_id) AS count
        FROM premier_rattachements pr
        WHERE pr.date <= m.last_day) AS total_utilisateurs
FROM stats.monthly_bucket m
UNION ALL
SELECT m.first_day                                 AS mois,
       r.code                                      AS code_region,
       NULL::character varying                     AS code_departement,
       (SELECT count(DISTINCT pr.user_id) AS count
        FROM premier_rattachements pr
        WHERE pr.date >= m.first_day
          AND pr.date <= m.last_day
          AND pr.region_code::text = r.code::text) AS utilisateurs,
       (SELECT count(DISTINCT pr.user_id) AS count
        FROM premier_rattachements pr
        WHERE pr.date <= m.last_day
          AND pr.region_code::text = r.code::text) AS total_utilisateurs
FROM stats.monthly_bucket m
       JOIN region r ON true
UNION ALL
SELECT m.first_day                                      AS mois,
       NULL::character varying                          AS code_region,
       d.code                                           AS code_departement,
       (SELECT count(DISTINCT pr.user_id) AS count
        FROM premier_rattachements pr
        WHERE pr.date >= m.first_day
          AND pr.date <= m.last_day
          AND pr.departement_code::text = d.code::text) AS utilisateurs,
       (SELECT count(DISTINCT pr.user_id) AS count
        FROM premier_rattachements pr
        WHERE pr.date <= m.last_day
          AND pr.departement_code::text = d.code::text) AS total_utilisateurs
FROM stats.monthly_bucket m
       JOIN departement d ON true
ORDER BY 1;

-- view stats_locales_evolution_utilisateur
create view stats_locales_evolution_utilisateur(mois, code_region, code_departement, utilisateurs, total_utilisateurs) as
SELECT locales_evolution_utilisateur.mois,
       locales_evolution_utilisateur.code_region,
       locales_evolution_utilisateur.code_departement,
       locales_evolution_utilisateur.utilisateurs,
       locales_evolution_utilisateur.total_utilisateurs
FROM stats.locales_evolution_utilisateur;

-- materialized view stats.report_scores
create materialized view stats.report_scores as
SELECT c.collectivite_id,
       c.code_siren_insee,
       c.nom,
       ts.referentiel,
       ts.action_id,
       ts.score_realise,
       ts.score_programme,
       ts.score_realise_plus_programme,
       ts.score_pas_fait,
       ts.score_non_renseigne,
       ts.points_restants,
       ts.points_realises,
       ts.points_programmes,
       ts.points_max_personnalises,
       ts.points_max_referentiel,
       ts.avancement,
       ts.concerne,
       ts.desactive
FROM stats.collectivite c
       JOIN client_scores cs USING (collectivite_id)
       JOIN LATERAL private.convert_client_scores(cs.scores) ccc(referentiel, action_id, concerne, desactive,
                                                                 point_fait, point_pas_fait, point_potentiel,
                                                                 point_programme, point_referentiel,
                                                                 total_taches_count, point_non_renseigne,
                                                                 point_potentiel_perso, completed_taches_count,
                                                                 fait_taches_avancement, pas_fait_taches_avancement,
                                                                 programme_taches_avancement,
                                                                 pas_concerne_taches_avancement) ON true
       JOIN LATERAL private.to_tabular_score(ccc.*) ts(referentiel, action_id, score_realise, score_programme,
                                                       score_realise_plus_programme, score_pas_fait,
                                                       score_non_renseigne, points_restants, points_realises,
                                                       points_programmes, points_max_personnalises,
                                                       points_max_referentiel, avancement, concerne, desactive)
            ON true
ORDER BY c.collectivite_id;

-- materialized view stats.report_reponse_choix
create materialized view stats.report_reponse_choix as
SELECT c.collectivite_id,
       c.code_siren_insee,
       c.nom,
       rc.question_id,
       rc.reponse
FROM stats.collectivite c
       JOIN reponse_choix rc USING (collectivite_id);

-- materialized view stats.report_reponse_binaire
create materialized view stats.report_reponse_binaire as
SELECT c.collectivite_id,
       c.code_siren_insee,
       c.nom,
       rb.question_id,
       rb.reponse
FROM stats.collectivite c
       JOIN reponse_binaire rb USING (collectivite_id);

-- materialized view stats.report_reponse_proportion
create materialized view stats.report_reponse_proportion as
SELECT c.collectivite_id,
       c.code_siren_insee,
       c.nom,
       rp.question_id,
       rp.reponse
FROM stats.collectivite c
       JOIN reponse_proportion rp USING (collectivite_id);

-- function stats.amplitude_visite(tstzrange)
create function stats.amplitude_visite(range tstzrange) returns SETOF stats.amplitude_event
  language sql
BEGIN ATOMIC
WITH auditeurs AS (
  SELECT aa.auditeur AS user_id
  FROM audit_auditeur aa
)
SELECT v.user_id,
       (v.page || '_viewed'::text) AS event_type,
       (EXTRACT(epoch FROM v."time"))::integer AS "time",
       md5(((('visite'::text || v.page) || (v.user_id)::text) || (v."time")::text)) AS insert_id,
       jsonb_build_object('page', v.page, 'tag', v.tag, 'onglet', v.onglet, 'collectivite_id', v.collectivite_id, 'niveau_acces', pud.niveau_acces, 'fonction', pcm.fonction, 'champ_intervention', pcm.champ_intervention, 'collectivite', to_json(c.*)) AS event_properties,
       jsonb_build_object('fonctions', ( SELECT array_agg(DISTINCT m.fonction) AS array_agg
                                         FROM (private_collectivite_membre m
                                           JOIN private_utilisateur_droit pud_1 ON (((m.user_id = pud_1.user_id) AND (m.collectivite_id = pud_1.collectivite_id))))
                                         WHERE ((m.user_id = v.user_id) AND (m.fonction IS NOT NULL) AND pud_1.active)), 'auditeur', (v.user_id IN ( SELECT auditeurs.user_id
                                                                                                                                                     FROM auditeurs))) AS user_properties,
       ( SELECT release_version.name
         FROM stats.release_version
         WHERE (release_version."time" < v."time")
         ORDER BY release_version."time" DESC
         LIMIT 1) AS app_version,
       jsonb_build_object('collectivite_id', v.collectivite_id, 'collectivite_nom', ( SELECT nc.nom
                                                                                      FROM named_collectivite nc
                                                                                      WHERE (nc.collectivite_id = v.collectivite_id))) AS groups
FROM (((visite v
  LEFT JOIN private_utilisateur_droit pud ON (((v.user_id = pud.user_id) AND (v.collectivite_id = pud.collectivite_id))))
  LEFT JOIN private_collectivite_membre pcm ON (((v.collectivite_id = pcm.collectivite_id) AND (v.user_id = pcm.user_id))))
  LEFT JOIN stats.collectivite c ON ((v.collectivite_id = c.collectivite_id)))
WHERE (amplitude_visite.range @> v."time");
END;
comment on function stats.amplitude_visite(tstzrange) is 'Les `events` Amplitude construits à partir des visites.';

-- materialized view private.retool_plan_action_premier_usage
create materialized view private.retool_plan_action_premier_usage as
WITH first AS (WITH fiche_axe AS (WITH min_fiche AS (WITH min_fiche AS (SELECT fiche_action.collectivite_id,
                                                                               min(fiche_action.created_at) AS created_at
                                                                        FROM fiche_action
                                                                        GROUP BY fiche_action.collectivite_id)
                                                     SELECT fa_1.collectivite_id,
                                                            min(fa_1.id) AS id
                                                     FROM fiche_action fa_1
                                                            JOIN min_fiche mf
                                                                 ON mf.collectivite_id = fa_1.collectivite_id AND
                                                                    mf.created_at = fa_1.created_at
                                                     GROUP BY fa_1.collectivite_id),
                                       min_axe AS (WITH min_axe AS (SELECT axe.collectivite_id,
                                                                           min(axe.created_at) AS created_at
                                                                    FROM axe
                                                                    GROUP BY axe.collectivite_id)
                                                   SELECT a.collectivite_id,
                                                          min(a.id) AS id
                                                   FROM axe a
                                                          JOIN min_axe ma
                                                               ON ma.collectivite_id = a.collectivite_id AND ma.created_at = a.created_at
                                                   GROUP BY a.collectivite_id)
                                  SELECT fa_1.collectivite_id,
                                         fa_1.created_at,
                                         fa_1.modified_by,
                                         true AS fiche
                                  FROM fiche_action fa_1
                                         JOIN min_fiche USING (id)
                                  UNION
                                  SELECT a.collectivite_id,
                                         a.created_at,
                                         a.modified_by,
                                         false AS fiche
                                  FROM axe a
                                         JOIN min_axe USING (id)),
                    min_fiche_axe AS (SELECT fiche_axe.collectivite_id,
                                             min(fiche_axe.created_at) AS created_at
                                      FROM fiche_axe
                                      GROUP BY fiche_axe.collectivite_id)
               SELECT fa.collectivite_id,
                      fa.created_at,
                      fa.fiche,
                      dcp.email
               FROM fiche_axe fa
                      JOIN min_fiche_axe mfa
                           ON fa.collectivite_id = mfa.collectivite_id AND fa.created_at = mfa.created_at
                      LEFT JOIN dcp ON fa.modified_by = dcp.user_id
               ORDER BY fa.fiche)
SELECT nc.collectivite_id,
       nc.nom,
       f.fiche,
       f.created_at,
       f.email
FROM stats.collectivite nc
       JOIN LATERAL ( SELECT f_1.collectivite_id,
                             f_1.created_at,
                             f_1.fiche,
                             f_1.email
                      FROM first f_1
                      WHERE f_1.collectivite_id = nc.collectivite_id
                      LIMIT 1) f ON true
ORDER BY f.created_at DESC;
comment on materialized view private.retool_plan_action_premier_usage is 'Vue pour identifier la toute première utilisation de la fonctionnalité plan action
    par les collectivités.';

-- view retool_plan_action_premier_usage
create view retool_plan_action_premier_usage(collectivite_id, nom, fiche, created_at, email) as
SELECT retool_plan_action_premier_usage.collectivite_id,
       retool_plan_action_premier_usage.nom,
       retool_plan_action_premier_usage.fiche,
       retool_plan_action_premier_usage.created_at,
       retool_plan_action_premier_usage.email
FROM private.retool_plan_action_premier_usage
WHERE is_service_role();

-- materialized view stats.engagement_collectivite
create materialized view stats.engagement_collectivite as
SELECT c.collectivite_id,
       COALESCE(cot.actif, false) AS cot,
       COALESCE(eci.etoiles, 0)   AS etoiles_eci,
       COALESCE(cae.etoiles, 0)   AS etoiles_cae
FROM stats.collectivite c
       LEFT JOIN cot USING (collectivite_id)
       LEFT JOIN LATERAL ( SELECT l.etoiles
                           FROM labellisation l
                           WHERE l.collectivite_id = c.collectivite_id
                             AND l.referentiel = 'eci'::referentiel
                           ORDER BY l.obtenue_le DESC
                           LIMIT 1) eci ON true
       LEFT JOIN LATERAL ( SELECT l.etoiles
                           FROM labellisation l
                           WHERE l.collectivite_id = c.collectivite_id
                             AND l.referentiel = 'cae'::referentiel
                           ORDER BY l.obtenue_le DESC
                           LIMIT 1) cae ON true;

-- view crm_droits
create view crm_droits
    (key, user_id, user_key, collectivite_id, collectivite_key, niveau_acces, fonction, details_fonction,
     champ_intervention)
as
SELECT (d.collectivite_id || ' '::text) || d.user_id                   AS key,
       d.user_id,
       (p.prenom || ' '::text) || p.nom                                AS user_key,
       d.collectivite_id,
       ((c.nom::text || ' ('::text) || c.collectivite_id) || ')'::text AS collectivite_key,
       d.niveau_acces,
       m.fonction,
       m.details_fonction,
       array_to_string(m.champ_intervention, ','::text)                AS champ_intervention
FROM private_utilisateur_droit d
       JOIN stats.collectivite c ON d.collectivite_id = c.collectivite_id
       JOIN dcp p ON p.user_id = d.user_id
       LEFT JOIN private_collectivite_membre m ON m.user_id = d.user_id AND m.collectivite_id = d.collectivite_id
WHERE d.active
  AND is_service_role()
ORDER BY d.collectivite_id;

-- view crm_labellisations
create view crm_labellisations
    (id, collectivite_key, referentiel, obtenue_le, annee, etoiles, score_realise, score_programme) as
SELECT l.id,
       ((collectivite.nom::text || ' ('::text) || collectivite.collectivite_id) || ')'::text AS collectivite_key,
       l.referentiel,
       l.obtenue_le,
       l.annee,
       l.etoiles,
       l.score_realise,
       l.score_programme
FROM stats.collectivite
       JOIN labellisation l USING (collectivite_id)
WHERE is_service_role()
ORDER BY collectivite.nom, l.obtenue_le DESC;

-- materialized view site_labellisation
create materialized view site_labellisation as
WITH dl AS (SELECT l.collectivite_id,
                   l.referentiel,
                   max(l.obtenue_le) AS obtenue_le
            FROM labellisation l
            GROUP BY l.collectivite_id, l.referentiel)
SELECT c.collectivite_id,
       c.nom,
       c.type_collectivite,
       c.nature_collectivite,
       c.code_siren_insee,
       c.region_name,
       c.region_code,
       c.departement_name,
       c.departement_code,
       c.population_totale,
       ca.* IS NOT NULL                                                                             AS active,
       COALESCE(cot.actif, false)                                                                   AS cot,
       dl_cae.obtenue_le IS NOT NULL OR dl_eci.obtenue_le IS NOT NULL OR COALESCE(cot.actif, false) AS engagee,
       dl_cae.obtenue_le IS NOT NULL OR dl_eci.obtenue_le IS NOT NULL                               AS labellisee,
       dl_cae.obtenue_le                                                                            AS cae_obtenue_le,
       dl_cae.etoiles                                                                               AS cae_etoiles,
       dl_cae.score_realise                                                                         AS cae_score_realise,
       dl_cae.score_programme                                                                       AS cae_score_programme,
       dl_eci.obtenue_le                                                                            AS eci_obtenue_le,
       dl_eci.etoiles                                                                               AS eci_etoiles,
       dl_eci.score_realise                                                                         AS eci_score_realise,
       dl_eci.score_programme                                                                       AS eci_score_programme
FROM stats.collectivite c
       LEFT JOIN stats.collectivite_active ca USING (collectivite_id)
       LEFT JOIN cot USING (collectivite_id)
       LEFT JOIN LATERAL ( SELECT l.id,
                                  l.collectivite_id,
                                  l.referentiel,
                                  l.obtenue_le,
                                  l.annee,
                                  l.etoiles,
                                  l.score_realise,
                                  l.score_programme
                           FROM dl
                                  JOIN labellisation l ON l.collectivite_id = dl.collectivite_id AND
                                                          l.referentiel = dl.referentiel AND
                                                          l.obtenue_le = dl.obtenue_le
                           WHERE dl.collectivite_id = c.collectivite_id
                             AND dl.referentiel = 'cae'::referentiel) dl_cae ON true
       LEFT JOIN LATERAL ( SELECT l.id,
                                  l.collectivite_id,
                                  l.referentiel,
                                  l.obtenue_le,
                                  l.annee,
                                  l.etoiles,
                                  l.score_realise,
                                  l.score_programme
                           FROM dl
                                  JOIN labellisation l ON l.collectivite_id = dl.collectivite_id AND
                                                          l.referentiel = dl.referentiel AND
                                                          l.obtenue_le = dl.obtenue_le
                           WHERE dl.collectivite_id = c.collectivite_id
                             AND dl.referentiel = 'eci'::referentiel) dl_eci ON true;

comment on materialized view site_labellisation is 'Les dernières info de labellisation affichées sur notre site.';

-- function geojson(site_labellisation)
create function geojson(site_labellisation site_labellisation) returns SETOF jsonb
  security definer
  rows 1
  language sql
BEGIN ATOMIC
SELECT COALESCE(eg.geojson, cg.geojson) AS "coalesce"
FROM ((((named_collectivite n
  LEFT JOIN epci e USING (collectivite_id))
  LEFT JOIN stats.epci_geojson eg ON (((e.siren)::text = eg.siren)))
  LEFT JOIN commune c USING (collectivite_id))
  LEFT JOIN stats.commune_geojson cg ON (((c.code)::text = cg.insee)))
WHERE (n.collectivite_id = (geojson.site_labellisation).collectivite_id);
END;
comment on function geojson(site_labellisation) is 'Le contour geojson de la collectivité.';

-- function labellisations(site_labellisation)
create function labellisations(site_labellisation) returns SETOF labellisation[]
  security definer
  rows 1
  language sql
BEGIN ATOMIC
SELECT COALESCE(( SELECT array_agg(l.*) AS array_agg
                  FROM labellisation l
                  WHERE (l.collectivite_id = ($1).collectivite_id)), '{}'::labellisation[]) AS "coalesce";
END;
comment on function labellisations(site_labellisation) is 'Données de labellisation historique.';


-- function indicateur_artificialisation(site_labellisation)
create function indicateur_artificialisation(site_labellisation) returns SETOF indicateur_artificialisation
  security definer
  rows 1
  language sql
BEGIN ATOMIC
SELECT ia.*::indicateur_artificialisation AS ia
FROM indicateur_artificialisation ia
WHERE (ia.collectivite_id = ($1).collectivite_id);
END;
comment on function indicateur_artificialisation(site_labellisation) is 'Flux de consommation d’espaces, par destination entre 2009 et 2022';

-- function indicateurs_gaz_effet_serre(site_labellisation)
create function indicateurs_gaz_effet_serre(site_labellisation) returns jsonb
  security definer
  language sql
BEGIN ATOMIC
SELECT to_jsonb(array_agg(d.*)) AS to_jsonb
FROM ( SELECT iri.date_valeur,
              iri.resultat,
              id.identifiant_referentiel AS identifiant,
              src.libelle AS source
       FROM (((indicateur_valeur iri
         JOIN indicateur_definition id ON ((iri.indicateur_id = id.id)))
         JOIN indicateur_source_metadonnee ism ON ((ism.id = iri.metadonnee_id)))
         JOIN indicateur_source src ON ((src.id = ism.source_id)))
       WHERE ((iri.collectivite_id = ($1).collectivite_id) AND (iri.metadonnee_id IS NOT NULL) AND (iri.resultat IS NOT NULL) AND (src.id = 'citepa'::text) AND (id.identifiant_referentiel = ANY (ARRAY[('cae_1.g'::character varying)::text, ('cae_1.f'::character varying)::text, ('cae_1.h'::character varying)::text, ('cae_1.j'::character varying)::text, ('cae_1.i'::character varying)::text, ('cae_1.c'::character varying)::text, ('cae_1.e'::character varying)::text, ('cae_1.d'::character varying)::text, ('cae_1.a'::character varying)::text])))) d;
END;
comment on function indicateurs_gaz_effet_serre(site_labellisation) is 'Indicateurs gaz à effet de serre.';

-- view crm_collectivites
create view crm_collectivites
    (key, collectivite_id, nom, type_collectivite, nature_collectivite, code_siren_insee, region_name,
     region_code, departement_name, departement_code, population_totale, cot, lab_cae_etoiles,
     lab_cae_programme, lab_cae_realise, lab_cae_annee, lab_eci_etoiles, lab_eci_programme, lab_eci_realise,
     lab_eci_annee)
as
SELECT ((c.nom::text || ' ('::text) || c.collectivite_id) || ')'::text AS key,
       c.collectivite_id,
       c.nom,
       c.type_collectivite,
       c.nature_collectivite,
       c.code_siren_insee,
       c.region_name,
       c.region_code,
       c.departement_name,
       c.departement_code,
       c.population_totale,
       COALESCE(cot.actif, false)                                      AS cot,
       ll_cae.etoiles                                                  AS lab_cae_etoiles,
       ll_cae.score_programme                                          AS lab_cae_programme,
       ll_cae.score_realise                                            AS lab_cae_realise,
       ll_cae.annee                                                    AS lab_cae_annee,
       ll_eci.etoiles                                                  AS lab_eci_etoiles,
       ll_eci.score_programme                                          AS lab_eci_programme,
       ll_eci.score_realise                                            AS lab_eci_realise,
       ll_eci.annee                                                    AS lab_eci_annee
FROM stats.collectivite c
       LEFT JOIN cot USING (collectivite_id)
       LEFT JOIN LATERAL ( SELECT l2.referentiel,
                                  l2.etoiles,
                                  l2.score_programme,
                                  l2.score_realise,
                                  l2.annee
                           FROM labellisation l2
                           WHERE l2.collectivite_id = c.collectivite_id
                             AND l2.referentiel = 'cae'::referentiel
                           ORDER BY l2.annee DESC
                           LIMIT 1) ll_cae ON true
       LEFT JOIN LATERAL ( SELECT l2.referentiel,
                                  l2.etoiles,
                                  l2.score_programme,
                                  l2.score_realise,
                                  l2.annee
                           FROM labellisation l2
                           WHERE l2.collectivite_id = c.collectivite_id
                             AND l2.referentiel = 'eci'::referentiel
                           ORDER BY l2.annee DESC
                           LIMIT 1) ll_eci ON true
WHERE is_service_role();

-- materialized view stats.collectivite_referentiel
create materialized view stats.collectivite_referentiel as
SELECT c.collectivite_id,
       c.nom,
       c.type_collectivite,
       c.nature_collectivite,
       c.code_siren_insee,
       c.region_name,
       c.region_code,
       c.departement_name,
       c.departement_code,
       c.population_totale,
       c.departement_iso_3166,
       c.region_iso_3166,
       collectivite_card.etoiles_cae,
       collectivite_card.etoiles_eci,
       collectivite_card.etoiles_all,
       collectivite_card.score_fait_cae,
       collectivite_card.score_fait_eci,
       collectivite_card.score_fait_min,
       collectivite_card.score_fait_max,
       collectivite_card.score_fait_sum,
       collectivite_card.score_programme_cae,
       collectivite_card.score_programme_eci,
       collectivite_card.score_programme_max,
       collectivite_card.score_programme_sum,
       collectivite_card.completude_cae,
       collectivite_card.completude_eci,
       collectivite_card.completude_min,
       collectivite_card.completude_max,
       collectivite_card.population_intervalle,
       collectivite_card.completude_cae_intervalle,
       collectivite_card.completude_eci_intervalle,
       collectivite_card.completude_intervalles,
       collectivite_card.fait_cae_intervalle,
       collectivite_card.fait_eci_intervalle,
       collectivite_card.fait_intervalles
FROM collectivite_card
       JOIN stats.collectivite c USING (collectivite_id);

-- materialized view stats.locales_evolution_collectivite_avec_minimum_fiches
create materialized view stats.locales_evolution_collectivite_avec_minimum_fiches as
WITH fiche_collectivite AS (SELECT mb.first_day                                                              AS mois,
                                   c.collectivite_id,
                                   c.region_code,
                                   c.departement_code,
                                   COALESCE(count(*) FILTER (WHERE fa.created_at <= mb.last_day), 0::bigint) AS fiches
                            FROM stats.monthly_bucket mb
                                   JOIN stats.collectivite c ON true
                                   LEFT JOIN fiche_action fa USING (collectivite_id)
                            GROUP BY mb.first_day, c.collectivite_id, c.departement_code, c.region_code)
SELECT fiche_collectivite.mois,
       NULL::character varying(2)                            AS code_region,
       NULL::character varying(2)                            AS code_departement,
       count(*) FILTER (WHERE fiche_collectivite.fiches > 5) AS collectivites
FROM fiche_collectivite
GROUP BY fiche_collectivite.mois
UNION ALL
SELECT fiche_collectivite.mois,
       fiche_collectivite.region_code                        AS code_region,
       NULL::character varying                               AS code_departement,
       count(*) FILTER (WHERE fiche_collectivite.fiches > 5) AS collectivites
FROM fiche_collectivite
GROUP BY fiche_collectivite.mois, fiche_collectivite.region_code
UNION ALL
SELECT fiche_collectivite.mois,
       NULL::character varying                               AS code_region,
       fiche_collectivite.departement_code                   AS code_departement,
       count(*) FILTER (WHERE fiche_collectivite.fiches > 5) AS collectivites
FROM fiche_collectivite
GROUP BY fiche_collectivite.mois, fiche_collectivite.departement_code
ORDER BY 1;

-- view stats_locales_evolution_collectivite_avec_minimum_fiches
create view stats_locales_evolution_collectivite_avec_minimum_fiches(mois, code_region, code_departement, collectivites) as
SELECT locales_evolution_collectivite_avec_minimum_fiches.mois,
       locales_evolution_collectivite_avec_minimum_fiches.code_region,
       locales_evolution_collectivite_avec_minimum_fiches.code_departement,
       locales_evolution_collectivite_avec_minimum_fiches.collectivites
FROM stats.locales_evolution_collectivite_avec_minimum_fiches;

-- materialized view stats.locales_evolution_nombre_fiches
create materialized view stats.locales_evolution_nombre_fiches as
SELECT mb.first_day                                         AS mois,
       NULL::character varying(2)                           AS code_region,
       NULL::character varying(2)                           AS code_departement,
       count(*) FILTER (WHERE fa.created_at <= mb.last_day) AS fiches
FROM stats.monthly_bucket mb
       JOIN stats.collectivite ca ON true
       JOIN fiche_action fa USING (collectivite_id)
GROUP BY mb.first_day
UNION ALL
SELECT mb.first_day                                         AS mois,
       ca.region_code                                       AS code_region,
       NULL::character varying                              AS code_departement,
       count(*) FILTER (WHERE fa.created_at <= mb.last_day) AS fiches
FROM stats.monthly_bucket mb
       JOIN stats.collectivite ca ON true
       LEFT JOIN fiche_action fa USING (collectivite_id)
GROUP BY mb.first_day, ca.region_code
UNION ALL
SELECT mb.first_day                                         AS mois,
       NULL::character varying                              AS code_region,
       ca.departement_code                                  AS code_departement,
       count(*) FILTER (WHERE fa.created_at <= mb.last_day) AS fiches
FROM stats.monthly_bucket mb
       JOIN stats.collectivite ca ON true
       LEFT JOIN fiche_action fa USING (collectivite_id)
GROUP BY mb.first_day, ca.departement_code
ORDER BY 1;

-- view stats_locales_evolution_nombre_fiches
create view stats_locales_evolution_nombre_fiches(mois, code_region, code_departement, fiches) as
SELECT locales_evolution_nombre_fiches.mois,
       locales_evolution_nombre_fiches.code_region,
       locales_evolution_nombre_fiches.code_departement,
       locales_evolution_nombre_fiches.fiches
FROM stats.locales_evolution_nombre_fiches;

-- materialized view stats.locales_labellisation_par_niveau
create materialized view stats.locales_labellisation_par_niveau as
WITH latest_labellisation AS (SELECT l.collectivite_id,
                                     l.referentiel,
                                     (SELECT ll.etoiles
                                      FROM labellisation ll
                                      WHERE ll.collectivite_id = l.collectivite_id
                                        AND ll.referentiel = l.referentiel
                                        AND ll.obtenue_le > (now() - '4 years'::interval)
                                      ORDER BY ll.obtenue_le DESC
                                      LIMIT 1) AS etoiles
                              FROM labellisation l
                              GROUP BY l.collectivite_id, l.referentiel),
     labellisation_locales AS (SELECT l.etoiles,
                                      l.referentiel,
                                      c.region_code,
                                      c.departement_code
                               FROM latest_labellisation l
                                      JOIN stats.collectivite c USING (collectivite_id)
                               WHERE l.etoiles IS NOT NULL
                                 AND l.etoiles > 0)
SELECT NULL::character varying(2) AS code_region,
       NULL::character varying(2) AS code_departement,
       labellisation_locales.referentiel,
       labellisation_locales.etoiles,
       count(*)                   AS labellisations
FROM labellisation_locales
GROUP BY labellisation_locales.referentiel, labellisation_locales.etoiles
UNION ALL
SELECT r.code                          AS code_region,
       NULL::character varying         AS code_departement,
       l.referentiel,
       l.etoiles,
       COALESCE(count(l.*), 0::bigint) AS labellisations
FROM imports.region r
       JOIN labellisation_locales l ON l.region_code::text = r.code::text
GROUP BY l.referentiel, l.etoiles, r.code
UNION ALL
SELECT NULL::character varying         AS code_region,
       d.code                          AS code_departement,
       l.referentiel,
       l.etoiles,
       COALESCE(count(l.*), 0::bigint) AS labellisations
FROM imports.departement d
       JOIN labellisation_locales l ON l.departement_code::text = d.code::text
GROUP BY l.referentiel, l.etoiles, d.code;

-- view stats_locales_labellisation_par_niveau
create view stats_locales_labellisation_par_niveau(code_region, code_departement, referentiel, etoiles, labellisations) as
SELECT locales_labellisation_par_niveau.code_region,
       locales_labellisation_par_niveau.code_departement,
       locales_labellisation_par_niveau.referentiel,
       locales_labellisation_par_niveau.etoiles,
       locales_labellisation_par_niveau.labellisations
FROM stats.locales_labellisation_par_niveau;

-- materialized view stats.report_indicateur_resultat
create materialized view stats.report_indicateur_resultat as
SELECT c.collectivite_id,
       c.code_siren_insee,
       c.nom,
       ir.indicateur_id,
       EXTRACT(year FROM ir.date_valeur) AS annee,
       ir.resultat
FROM stats.collectivite c
       JOIN indicateur_valeur ir USING (collectivite_id)
WHERE ir.resultat IS NOT NULL
ORDER BY c.collectivite_id, ir.date_valeur;

-- materialized view stats.locales_evolution_resultat_indicateur_personnalise
create materialized view stats.locales_evolution_resultat_indicateur_personnalise as
WITH resultats AS (SELECT iv.collectivite_id,
                          sc.region_code,
                          sc.departement_code,
                          iv.modified_at
                   FROM indicateur_valeur iv
                          JOIN indicateur_definition id ON iv.indicateur_id = id.id
                          JOIN stats.collectivite sc ON iv.collectivite_id = sc.collectivite_id
                   WHERE iv.resultat IS NOT NULL
                     AND id.collectivite_id IS NOT NULL)
SELECT m.first_day                AS mois,
       NULL::character varying(2) AS code_region,
       NULL::character varying(2) AS code_departement,
       count(i.*)                 AS indicateurs
FROM stats.monthly_bucket m
       LEFT JOIN resultats i ON i.modified_at <= m.last_day
GROUP BY m.first_day
UNION ALL
SELECT m.first_day             AS mois,
       r.code                  AS code_region,
       NULL::character varying AS code_departement,
       count(i.*)              AS indicateurs
FROM imports.region r
       JOIN stats.monthly_bucket m ON true
       LEFT JOIN resultats i ON i.modified_at <= m.last_day AND i.region_code::text = r.code::text
GROUP BY m.first_day, r.code
UNION ALL
SELECT m.first_day             AS mois,
       NULL::character varying AS code_region,
       d.code                  AS code_departement,
       count(i.*)              AS indicateurs
FROM imports.departement d
       JOIN stats.monthly_bucket m ON true
       LEFT JOIN resultats i ON i.modified_at <= m.last_day AND i.departement_code::text = d.code::text
GROUP BY m.first_day, d.code
ORDER BY 1;

-- view stats_locales_evolution_resultat_indicateur_personnalise
create view stats_locales_evolution_resultat_indicateur_personnalise(mois, code_region, code_departement, indicateurs) as
SELECT locales_evolution_resultat_indicateur_personnalise.mois,
       locales_evolution_resultat_indicateur_personnalise.code_region,
       locales_evolution_resultat_indicateur_personnalise.code_departement,
       locales_evolution_resultat_indicateur_personnalise.indicateurs
FROM stats.locales_evolution_resultat_indicateur_personnalise;

-- materialized view stats.locales_evolution_indicateur_referentiel
create materialized view stats.locales_evolution_indicateur_referentiel as
WITH indicateurs AS (SELECT iv.collectivite_id,
                            sc.region_code,
                            sc.departement_code,
                            iv.indicateur_id,
                            min(iv.modified_at) AS first_modified_at
                     FROM indicateur_valeur iv
                            JOIN stats.collectivite sc ON iv.collectivite_id = sc.collectivite_id
                            JOIN indicateur_definition id ON iv.indicateur_id = id.id
                     WHERE iv.resultat IS NOT NULL
                       AND id.collectivite_id IS NULL
                     GROUP BY iv.collectivite_id, sc.region_code, sc.departement_code, iv.indicateur_id)
SELECT m.first_day                AS mois,
       NULL::character varying(2) AS code_region,
       NULL::character varying(2) AS code_departement,
       count(i.*)                 AS indicateurs
FROM stats.monthly_bucket m
       LEFT JOIN indicateurs i ON i.first_modified_at <= m.last_day
GROUP BY m.first_day
UNION ALL
SELECT m.first_day             AS mois,
       r.code                  AS code_region,
       NULL::character varying AS code_departement,
       count(i.*)              AS indicateurs
FROM imports.region r
       JOIN stats.monthly_bucket m ON true
       LEFT JOIN indicateurs i ON i.first_modified_at <= m.last_day AND i.region_code::text = r.code::text
GROUP BY m.first_day, r.code
UNION ALL
SELECT m.first_day             AS mois,
       NULL::character varying AS code_region,
       d.code                  AS code_departement,
       count(i.*)              AS indicateurs
FROM imports.departement d
       JOIN stats.monthly_bucket m ON true
       LEFT JOIN indicateurs i ON i.first_modified_at <= m.last_day AND i.departement_code::text = d.code::text
GROUP BY m.first_day, d.code;

-- view stats_locales_evolution_indicateur_referentiel
create view stats_locales_evolution_indicateur_referentiel(mois, code_region, code_departement, indicateurs) as
SELECT locales_evolution_indicateur_referentiel.mois,
       locales_evolution_indicateur_referentiel.code_region,
       locales_evolution_indicateur_referentiel.code_departement,
       locales_evolution_indicateur_referentiel.indicateurs
FROM stats.locales_evolution_indicateur_referentiel;

-- materialized view stats.crm_usages
create materialized view stats.crm_usages as
WITH premier_rattachements AS (SELECT private_utilisateur_droit.collectivite_id,
                                      min(private_utilisateur_droit.created_at)::date AS date
                               FROM private_utilisateur_droit
                               WHERE private_utilisateur_droit.active
                               GROUP BY private_utilisateur_droit.collectivite_id),
     comptes AS (SELECT c_1.collectivite_id,
                        (SELECT count(*) AS count
                         FROM fiche_action x_1
                         WHERE x_1.collectivite_id = c_1.collectivite_id) AS fiches,
                        (SELECT count(*) AS count
                         FROM axe x_1
                         WHERE x_1.collectivite_id = c_1.collectivite_id
                           AND x_1.parent IS NULL)                        AS plans,
                        (SELECT count(*) AS count
                         FROM indicateur_valeur x_1
                                JOIN indicateur_definition id ON x_1.indicateur_id = id.id
                         WHERE x_1.collectivite_id = c_1.collectivite_id
                           AND x_1.resultat IS NOT NULL
                           AND id.collectivite_id IS NULL)                AS resultats_indicateurs,
                        (SELECT count(*) AS count
                         FROM indicateur_definition x_1
                         WHERE x_1.collectivite_id IS NOT NULL
                           AND x_1.collectivite_id = c_1.collectivite_id) AS indicateurs_perso,
                        (SELECT count(*) AS count
                         FROM indicateur_valeur x_1
                                JOIN indicateur_definition id ON x_1.indicateur_id = id.id
                         WHERE x_1.collectivite_id = c_1.collectivite_id
                           AND x_1.resultat IS NOT NULL
                           AND id.collectivite_id IS NOT NULL)            AS resultats_indicateurs_perso
                 FROM stats.collectivite c_1)
SELECT c.collectivite_id,
       ((c.nom::text || ' ('::text) || c.collectivite_id) || ')'::text                                AS key,
       pc.completude_eci,
       pc.completude_cae,
       x.fiches,
       x.plans,
       x.resultats_indicateurs,
       x.indicateurs_perso,
       x.resultats_indicateurs_perso,
       pr.date                                                                                        AS premier_rattachement,
       (SELECT count(*) AS count
        FROM fiche_action f
        WHERE f.collectivite_id = c.collectivite_id
          AND f.titre IS NOT NULL
          AND (f.description IS NOT NULL OR f.objectifs IS NOT NULL))                                 AS fiches_initiees,
       (SELECT count(*) AS count
        FROM fiche_action f
        WHERE f.collectivite_id = c.collectivite_id
          AND (f.statut IS NOT NULL OR f.niveau_priorite IS NOT NULL OR f.date_debut IS NOT NULL OR
               f.date_fin_provisoire IS NOT NULL OR (f.id IN (SELECT fiche_action_structure_tag.fiche_id
                                                              FROM fiche_action_structure_tag)) OR
               (f.id IN (SELECT st.fiche_id
                         FROM fiche_action_pilote st)) OR (f.id IN (SELECT fiche_action_service_tag.fiche_id
                                                                    FROM fiche_action_service_tag)))) AS fiches_pilotage,
       (SELECT count(*) AS count
        FROM fiche_action f
        WHERE f.collectivite_id = c.collectivite_id
          AND (f.id IN (SELECT fiche_action_indicateur.fiche_id
                        FROM fiche_action_indicateur)))                                               AS fiches_indicateur,
       (SELECT count(*) AS count
        FROM fiche_action f
        WHERE f.collectivite_id = c.collectivite_id
          AND (f.id IN (SELECT fiche_action_action.fiche_id
                        FROM fiche_action_action)))                                                   AS fiches_action_referentiel,
       (SELECT count(*) AS count
        FROM fiche_action f
        WHERE f.collectivite_id = c.collectivite_id
          AND (f.id IN (SELECT fiches_liees_par_fiche.fiche_id
                        FROM fiches_liees_par_fiche)))                                                AS fiches_fiche_liee,
       (SELECT count(*) AS count
        FROM fiche_action f
        WHERE f.collectivite_id = c.collectivite_id
          AND f.modified_at > (CURRENT_TIMESTAMP - '1 mon'::interval))                                AS fiches_mod_1mois,
       (SELECT count(*) AS count
        FROM fiche_action f
        WHERE f.collectivite_id = c.collectivite_id
          AND f.modified_at > (CURRENT_TIMESTAMP - '3 mons'::interval))                               AS fiches_mod_3mois,
       (SELECT count(*) AS count
        FROM fiche_action f
        WHERE f.collectivite_id = c.collectivite_id
          AND f.modified_at > (CURRENT_TIMESTAMP - '6 mons'::interval))                               AS fiches_mod_6mois,
       (SELECT min(f.created_at) AS min
        FROM (SELECT p.created_at,
                     count(f_1.*) AS nb_fiche
              FROM fiche_action f_1
                     JOIN fiche_action_axe faa ON f_1.id = faa.fiche_id
                     JOIN axe a ON a.id = faa.axe_id
                     JOIN axe p ON a.plan = p.id
              WHERE f_1.collectivite_id = c.collectivite_id
                AND (f_1.titre IS NOT NULL OR f_1.titre::text <> 'Nouvelle fiche'::text)
                AND p.nom IS NOT NULL
              GROUP BY p.id, p.created_at) f
        WHERE f.nb_fiche > 4)                                                                         AS pa_date_creation,
       (SELECT count(*) AS count
        FROM visite
        WHERE (visite.page = ANY (ARRAY ['plan'::visite_page, 'fiche'::visite_page, 'tableau_de_bord'::visite_page]))
          AND visite.collectivite_id = c.collectivite_id
          AND visite."time" >= (CURRENT_TIMESTAMP - '2 mons'::interval))                              AS pa_view_2mois,
       (SELECT count(*) AS count
        FROM visite
        WHERE (visite.page = ANY (ARRAY ['plan'::visite_page, 'fiche'::visite_page, 'tableau_de_bord'::visite_page]))
          AND visite.collectivite_id = c.collectivite_id
          AND visite."time" >= (CURRENT_TIMESTAMP - '6 mons'::interval))                              AS pa_view_6mois,
       (SELECT count(*) AS count
        FROM (SELECT p.id,
                     count(f_1.*) AS nb_fiche
              FROM fiche_action f_1
                     JOIN fiche_action_axe faa ON f_1.id = faa.fiche_id
                     JOIN axe a ON a.id = faa.axe_id
                     JOIN axe p ON a.plan = p.id
              WHERE f_1.collectivite_id = c.collectivite_id
                AND (f_1.titre IS NOT NULL OR f_1.titre::text <> 'Nouvelle fiche'::text)
                AND p.nom IS NOT NULL
              GROUP BY p.id) f
        WHERE f.nb_fiche > 4)                                                                         AS pa_non_vides,
       (SELECT count(pa.id) AS count
        FROM (SELECT p.collectivite_id,
                     p.id,
                     count(p.fiche_id) AS nb_fiches
              FROM (SELECT f.collectivite_id,
                           p_1.id,
                           f.id AS fiche_id
                    FROM fiche_action f
                           LEFT JOIN fiche_action_pilote fap ON f.id = fap.fiche_id
                           LEFT JOIN fiche_action_structure_tag fas ON fas.fiche_id = f.id
                           LEFT JOIN fiche_action_service_tag faserv ON faserv.fiche_id = f.id
                           JOIN fiche_action_axe faa ON f.id = faa.fiche_id
                           JOIN axe a ON a.id = faa.axe_id
                           JOIN axe p_1 ON a.plan = p_1.id
                    WHERE (f.titre IS NOT NULL OR f.titre::text <> 'Nouvelle fiche'::text)
                      AND f.collectivite_id = c.collectivite_id
                      AND f.statut IS NOT NULL
                      AND p_1.nom IS NOT NULL
                    GROUP BY f.collectivite_id, p_1.id, f.id
                    HAVING (count(DISTINCT fap.user_id) + count(DISTINCT fap.tag_id) +
                            count(DISTINCT fas.structure_tag_id) + count(DISTINCT faserv.service_tag_id)) > 0) p
              GROUP BY p.collectivite_id, p.id) pa
        WHERE pa.nb_fiches > 4)                                                                       AS pa_pilotables,
       (SELECT count(*) AS count
        FROM fiche_action f
        WHERE f.collectivite_id = c.collectivite_id
          AND (f.titre IS NOT NULL OR f.titre::text <> 'Nouvelle fiche'::text))                       AS fiches_non_vides,
       (SELECT count(f_2.*) AS count
        FROM (SELECT f.id
              FROM fiche_action f
                     LEFT JOIN fiche_action_pilote fap ON f.id = fap.fiche_id
                     LEFT JOIN fiche_action_structure_tag fas ON fas.fiche_id = f.id
                     LEFT JOIN fiche_action_service_tag faserv ON faserv.fiche_id = f.id
              WHERE f.collectivite_id = c.collectivite_id
                AND f.titre IS NOT NULL
                AND f.titre::text <> 'Nouvelle fiche'::text
                AND f.statut IS NOT NULL
              GROUP BY f.id
              HAVING (count(DISTINCT fap.user_id) + count(DISTINCT fap.tag_id) + count(DISTINCT fas.structure_tag_id) +
                      count(DISTINCT faserv.service_tag_id)) >
                     0) f_2)                                                                          AS fiches_pilotables,
       (SELECT count(*) > 4
        FROM fiche_action f
               LEFT JOIN fiche_action_pilote fap ON f.id = fap.fiche_id
        WHERE f.collectivite_id = c.collectivite_id
          AND (f.titre IS NOT NULL OR f.titre::text <> 'Nouvelle fiche'::text)
          AND (f.statut IS NOT NULL OR f.niveau_priorite IS NOT NULL OR f.date_fin_provisoire IS NOT NULL OR
               fap.* IS NOT NULL))                                                                    AS _5fiches_1pilotage,
       (SELECT count(*) AS count
        FROM historique.fiche_action f
        WHERE f.collectivite_id = c.collectivite_id
          AND (f.previous_statut <> f.statut OR f.previous_statut IS NULL AND f.statut IS NOT NULL OR
               f.previous_statut IS NOT NULL AND f.statut IS NULL)
          AND f.modified_at > (CURRENT_TIMESTAMP - '6 mons'::interval))                               AS fiches_changement_statut,
       CASE
         WHEN x.fiches = 0 THEN 0::numeric
         ELSE ((SELECT count(*) AS count
                FROM fiche_action f
                WHERE f.collectivite_id = c.collectivite_id
                  AND f.restreint = true))::numeric / x.fiches::numeric * 100::numeric
         END                                                                                        AS pourcentage_fa_privee,
       CASE
         WHEN x.fiches = 0 THEN 0::numeric
         ELSE ((SELECT count(*) AS count
                FROM fiche_action f
                       JOIN fiche_action_pilote fap ON f.id = fap.fiche_id
                WHERE f.collectivite_id = c.collectivite_id
                  AND f.restreint = true
                  AND (f.titre IS NOT NULL OR f.titre::text <> 'Nouvelle fiche'::text)
                  AND f.statut IS NOT NULL))::numeric / x.fiches::numeric * 100::numeric
         END                                                                                        AS pourcentage_fa_pilotable_privee,
       (SELECT count(ic.*) AS count
        FROM indicateur_collectivite ic
        WHERE ic.collectivite_id = c.collectivite_id
          AND ic.confidentiel = true)                                                                 AS indicateur_prive,
       (SELECT count(ic.*) > 0
        FROM indicateur_collectivite ic
        WHERE ic.collectivite_id = c.collectivite_id
          AND ic.confidentiel = true)                                                                 AS min1_indicateur_prive,
       (SELECT count(ic.*) > 0
        FROM indicateur_collectivite ic
               JOIN indicateur_definition id ON ic.indicateur_id = id.id
        WHERE ic.collectivite_id = c.collectivite_id
          AND id.collectivite_id IS NULL
          AND ic.confidentiel = true)                                                                 AS min1_indicateur_predef_prive,
       (SELECT count(ic.*) > 0
        FROM indicateur_collectivite ic
               JOIN indicateur_definition id ON ic.indicateur_id = id.id
        WHERE ic.collectivite_id = c.collectivite_id
          AND id.collectivite_id IS NOT NULL
          AND ic.confidentiel = true)                                                                 AS min1_indicateur_perso_prive,
       (SELECT i.pourcentage
        FROM (SELECT c_1.id  AS collectivite_id,
                     CASE
                       WHEN ((SELECT count(*) AS count
                              FROM indicateur_definition
                              WHERE indicateur_definition.collectivite_id IS NULL)) = 0 THEN 0::double precision
                       ELSE count(ic.*)::double precision / ((SELECT count(*) AS count
                                                              FROM indicateur_definition
                                                              WHERE indicateur_definition.collectivite_id IS NULL))::double precision *
                            100::double precision
                       END AS pourcentage
              FROM collectivite c_1
                     LEFT JOIN (SELECT i_1.indicateur_id,
                                       i_1.collectivite_id,
                                       i_1.commentaire,
                                       i_1.confidentiel,
                                       i_1.favoris
                                FROM indicateur_collectivite i_1
                                       JOIN indicateur_definition id ON i_1.indicateur_id = id.id
                                WHERE i_1.confidentiel = true
                                  AND id.collectivite_id IS NULL) ic ON ic.collectivite_id = c_1.id
              GROUP BY c_1.id) i
        WHERE i.collectivite_id = c.collectivite_id)                                                  AS pourcentage_indicateur_predef_prives,
       (SELECT array_to_string(array_agg(DISTINCT pat.type), ','::text) AS array_to_string
        FROM (SELECT p.id,
                     count(f_1.*) AS nb_fiche
              FROM fiche_action f_1
                     JOIN fiche_action_axe faa ON f_1.id = faa.fiche_id
                     JOIN axe a_1 ON a_1.id = faa.axe_id
                     JOIN axe p ON a_1.plan = p.id
              WHERE f_1.collectivite_id = c.collectivite_id
                AND (f_1.titre IS NOT NULL OR f_1.titre::text <> 'Nouvelle fiche'::text)
                AND p.nom IS NOT NULL
              GROUP BY p.id) f
               JOIN axe a ON f.id = a.id
               LEFT JOIN plan_action_type pat ON a.type = pat.id
        WHERE f.nb_fiche > 4)                                                                         AS type_pa_non_vides,
       (SELECT count(*) AS count
        FROM axe a
        WHERE a.nom = 'Plan d''action à impact'::text
          AND a.collectivite_id = c.collectivite_id)                                                  AS pai,
       (SELECT count(f_1.*) AS nb_fiches
        FROM fiche_action f_1
               JOIN fiche_action_axe faa ON f_1.id = faa.fiche_id
               JOIN axe a ON a.id = faa.axe_id
        WHERE a.nom = 'Plan d''action à impact'::text
          AND f_1.collectivite_id = c.collectivite_id)                                                AS fiches_pai
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

-- view crm_usages
create view crm_usages
    (collectivite_id, key, completude_eci, completude_cae, fiches, plans, resultats_indicateurs,
     indicateurs_perso, resultats_indicateurs_perso, premier_rattachement, fiches_initiees, fiches_pilotage,
     fiches_indicateur, fiches_action_referentiel, fiches_fiche_liee, fiches_mod_1mois, fiches_mod_3mois,
     fiches_mod_6mois, pa_date_creation, pa_view_2mois, pa_view_6mois, pa_non_vides, pa_pilotables,
     fiches_non_vides, fiches_pilotables, _5fiches_1pilotage, fiches_changement_statut, pourcentage_fa_privee,
     pourcentage_fa_pilotable_privee, indicateur_prive, min1_indicateur_prive, min1_indicateur_predef_prive,
     min1_indicateur_perso_prive, pourcentage_indicateur_predef_prives, type_pa_non_vides, pai, fiches_pai)
as
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

-- materialized view stats.locales_evolution_collectivite_avec_indicateur_referentiel
create materialized view stats.locales_evolution_collectivite_avec_indicateur_referentiel as
WITH indicateur_collectivite AS (SELECT mb.first_day AS mois,
                                        c.collectivite_id,
                                        c.region_code,
                                        c.departement_code,
                                        count(ir.*)  AS resultats
                                 FROM stats.monthly_bucket mb
                                        JOIN stats.collectivite c ON true
                                        LEFT JOIN (SELECT iv.id,
                                                          iv.indicateur_id,
                                                          iv.collectivite_id,
                                                          iv.date_valeur,
                                                          iv.metadonnee_id,
                                                          iv.resultat,
                                                          iv.resultat_commentaire,
                                                          iv.objectif,
                                                          iv.objectif_commentaire,
                                                          iv.estimation,
                                                          iv.modified_at,
                                                          iv.created_at,
                                                          iv.modified_by,
                                                          iv.created_by
                                                   FROM indicateur_valeur iv
                                                          JOIN indicateur_definition id ON iv.indicateur_id = id.id
                                                   WHERE iv.resultat IS NOT NULL
                                                     AND id.collectivite_id IS NULL) ir
                                                  ON ir.collectivite_id = c.collectivite_id AND
                                                     ir.modified_at <= mb.first_day
                                 GROUP BY mb.first_day, c.collectivite_id, c.region_code, c.departement_code)
SELECT indicateur_collectivite.mois,
       NULL::character varying(2)                                    AS code_region,
       NULL::character varying(2)                                    AS code_departement,
       count(*) FILTER (WHERE indicateur_collectivite.resultats > 0) AS collectivites
FROM indicateur_collectivite
GROUP BY indicateur_collectivite.mois
UNION ALL
SELECT indicateur_collectivite.mois,
       indicateur_collectivite.region_code                           AS code_region,
       NULL::character varying                                       AS code_departement,
       count(*) FILTER (WHERE indicateur_collectivite.resultats > 0) AS collectivites
FROM indicateur_collectivite
GROUP BY indicateur_collectivite.mois, indicateur_collectivite.region_code
UNION ALL
SELECT indicateur_collectivite.mois,
       NULL::character varying                                       AS code_region,
       indicateur_collectivite.departement_code                      AS code_departement,
       count(*) FILTER (WHERE indicateur_collectivite.resultats > 0) AS collectivites
FROM indicateur_collectivite
GROUP BY indicateur_collectivite.mois, indicateur_collectivite.departement_code
ORDER BY 1;

-- view stats_locales_evolution_collectivite_avec_indicateur
create view stats_locales_evolution_collectivite_avec_indicateur(mois, code_region, code_departement, collectivites) as
SELECT locales_evolution_collectivite_avec_indicateur_referentiel.mois,
       locales_evolution_collectivite_avec_indicateur_referentiel.code_region,
       locales_evolution_collectivite_avec_indicateur_referentiel.code_departement,
       locales_evolution_collectivite_avec_indicateur_referentiel.collectivites
FROM stats.locales_evolution_collectivite_avec_indicateur_referentiel;

-- materialized view stats.locales_evolution_resultat_indicateur_referentiel
create materialized view stats.locales_evolution_resultat_indicateur_referentiel as
WITH resultats AS (SELECT iv.collectivite_id,
                          sc.region_code,
                          sc.departement_code,
                          iv.modified_at
                   FROM indicateur_valeur iv
                          JOIN indicateur_definition id ON iv.indicateur_id = id.id
                          JOIN stats.collectivite sc ON sc.collectivite_id = iv.collectivite_id
                   WHERE iv.resultat IS NOT NULL
                     AND id.collectivite_id IS NULL),
     buck_by_cols AS (SELECT m.first_day    AS mois,
                             id.region_code AS code_region,
                             id.code        AS code_departement
                      FROM stats.monthly_bucket m
                             JOIN imports.departement id ON true),
     res_by_bucks AS (SELECT m.mois,
                             m.code_region,
                             m.code_departement,
                             count(i.*) AS indicateurs
                      FROM buck_by_cols m
                             LEFT JOIN resultats i
                                       ON i.modified_at <= m.mois AND m.code_departement::text = i.departement_code::text
                      GROUP BY m.mois, m.code_region, m.code_departement)
SELECT m.mois,
       NULL::character varying(2) AS code_region,
       NULL::character varying(2) AS code_departement,
       sum(m.indicateurs)         AS indicateurs
FROM res_by_bucks m
GROUP BY m.mois
UNION ALL
SELECT m.mois,
       m.code_region,
       NULL::character varying AS code_departement,
       sum(m.indicateurs)      AS indicateurs
FROM res_by_bucks m
GROUP BY m.mois, m.code_region
UNION ALL
SELECT m.mois,
       NULL::character varying AS code_region,
       m.code_departement,
       sum(m.indicateurs)      AS indicateurs
FROM res_by_bucks m
GROUP BY m.mois, m.code_departement
ORDER BY 1;

-- view stats_locales_evolution_resultat_indicateur_referentiel
create view stats_locales_evolution_resultat_indicateur_referentiel(mois, code_region, code_departement, indicateurs) as
SELECT locales_evolution_resultat_indicateur_referentiel.mois,
       locales_evolution_resultat_indicateur_referentiel.code_region,
       locales_evolution_resultat_indicateur_referentiel.code_departement,
       locales_evolution_resultat_indicateur_referentiel.indicateurs
FROM stats.locales_evolution_resultat_indicateur_referentiel;

-- view stats_carte_collectivite_active
create view stats_carte_collectivite_active
    (collectivite_id, nom, type_collectivite, nature_collectivite, code_siren_insee, region_name, region_code,
     departement_name, departement_code, population_totale, geojson)
as
SELECT carte_collectivite_active.collectivite_id,
       carte_collectivite_active.nom,
       carte_collectivite_active.type_collectivite,
       carte_collectivite_active.nature_collectivite,
       carte_collectivite_active.code_siren_insee,
       carte_collectivite_active.region_name,
       carte_collectivite_active.region_code,
       carte_collectivite_active.departement_name,
       carte_collectivite_active.departement_code,
       carte_collectivite_active.population_totale,
       carte_collectivite_active.geojson
FROM stats.carte_collectivite_active;
comment on view stats_carte_collectivite_active is 'Les collectivités actives avec leurs contours.';

-- materialized view stats.evolution_total_activation_par_type
create materialized view stats.evolution_total_activation_par_type as
SELECT m.first_day                              AS mois,
       (SELECT count(*) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total,
       (SELECT count(*) FILTER (WHERE cu.type_collectivite = 'EPCI'::type_collectivite) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total_epci,
       (SELECT count(*) FILTER (WHERE cu.type_collectivite = 'syndicat'::type_collectivite) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total_syndicat,
       (SELECT count(*) FILTER (WHERE cu.type_collectivite = 'commune'::type_collectivite) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total_commune
FROM stats.monthly_bucket m;

-- view stats_evolution_total_activation_par_type
create view stats_evolution_total_activation_par_type(mois, total, total_epci, total_syndicat, total_commune) as
SELECT evolution_total_activation_par_type.mois,
       evolution_total_activation_par_type.total,
       evolution_total_activation_par_type.total_epci,
       evolution_total_activation_par_type.total_syndicat,
       evolution_total_activation_par_type.total_commune
FROM stats.evolution_total_activation_par_type;

-- materialized view stats.collectivite_actives_et_total_par_type
create materialized view stats.collectivite_actives_et_total_par_type as
WITH collectivite AS (SELECT c.collectivite_id,
                             CASE
                               WHEN stats.is_fiscalite_propre(c.nature_collectivite) THEN 'EPCI'::text
                               WHEN c.type_collectivite = 'syndicat'::type_collectivite THEN 'syndicat'::text
                               WHEN c.type_collectivite = 'commune'::type_collectivite THEN 'commune'::text
                               ELSE NULL::text
                               END AS typologie
                      FROM stats.collectivite c)
SELECT collectivite.typologie,
       count(*)                                                                                   AS total,
       count(*) FILTER (WHERE (collectivite.collectivite_id IN (SELECT collectivite_active.collectivite_id
                                                                FROM stats.collectivite_active))) AS actives
FROM collectivite
GROUP BY collectivite.typologie;

-- view stats_collectivite_actives_et_total_par_type
create view stats_collectivite_actives_et_total_par_type(type_collectivite, total, actives) as
SELECT collectivite_actives_et_total_par_type.typologie AS type_collectivite,
       collectivite_actives_et_total_par_type.total,
       collectivite_actives_et_total_par_type.actives
FROM stats.collectivite_actives_et_total_par_type;

-- materialized view stats.locales_collectivite_actives_et_total_par_type
create materialized view stats.locales_collectivite_actives_et_total_par_type as
WITH collectivite_typologie AS (SELECT c.collectivite_id,
                                       c.region_code,
                                       c.departement_code,
                                       CASE
                                         WHEN stats.is_fiscalite_propre(c.nature_collectivite) THEN 'EPCI'::text
                                         WHEN c.type_collectivite = 'syndicat'::type_collectivite THEN 'syndicat'::text
                                         WHEN c.type_collectivite = 'commune'::type_collectivite THEN 'commune'::text
                                         ELSE NULL::text
                                         END AS typologie
                                FROM stats.collectivite c)
SELECT collectivite_typologie.typologie,
       NULL::character varying(2)                                                                           AS code_region,
       NULL::character varying(2)                                                                           AS code_departement,
       count(*)                                                                                             AS total,
       count(*) FILTER (WHERE (collectivite_typologie.collectivite_id IN (SELECT collectivite_active.collectivite_id
                                                                          FROM stats.collectivite_active))) AS actives
FROM collectivite_typologie
GROUP BY collectivite_typologie.typologie
UNION ALL
SELECT collectivite_typologie.typologie,
       collectivite_typologie.region_code                                                                   AS code_region,
       NULL::character varying                                                                              AS code_departement,
       count(*)                                                                                             AS total,
       count(*) FILTER (WHERE (collectivite_typologie.collectivite_id IN (SELECT collectivite_active.collectivite_id
                                                                          FROM stats.collectivite_active))) AS actives
FROM collectivite_typologie
GROUP BY collectivite_typologie.typologie, collectivite_typologie.region_code
UNION ALL
SELECT collectivite_typologie.typologie,
       NULL::character varying                                                                              AS code_region,
       collectivite_typologie.departement_code                                                              AS code_departement,
       count(*)                                                                                             AS total,
       count(*) FILTER (WHERE (collectivite_typologie.collectivite_id IN (SELECT collectivite_active.collectivite_id
                                                                          FROM stats.collectivite_active))) AS actives
FROM collectivite_typologie
GROUP BY collectivite_typologie.typologie, collectivite_typologie.departement_code;

-- view stats_locales_collectivite_actives_et_total_par_type
create view stats_locales_collectivite_actives_et_total_par_type(typologie, code_region, code_departement, total, actives) as
SELECT locales_collectivite_actives_et_total_par_type.typologie,
       locales_collectivite_actives_et_total_par_type.code_region,
       locales_collectivite_actives_et_total_par_type.code_departement,
       locales_collectivite_actives_et_total_par_type.total,
       locales_collectivite_actives_et_total_par_type.actives
FROM stats.locales_collectivite_actives_et_total_par_type;

-- materialized view stats.locales_evolution_total_activation
create materialized view stats.locales_evolution_total_activation as
SELECT m.first_day                              AS mois,
       NULL::character varying(2)               AS code_region,
       NULL::character varying(2)               AS code_departement,
       (SELECT count(*) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total,
       (SELECT count(*) FILTER (WHERE stats.is_fiscalite_propre(cu.nature_collectivite)) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total_epci,
       (SELECT count(*) FILTER (WHERE cu.type_collectivite = 'syndicat'::type_collectivite) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total_syndicat,
       (SELECT count(*) FILTER (WHERE cu.type_collectivite = 'commune'::type_collectivite) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total_commune,
       (SELECT count(*) FILTER (WHERE cu.type_collectivite <> 'commune'::type_collectivite AND
                                      cu.type_collectivite <> 'syndicat'::type_collectivite AND
                                      NOT stats.is_fiscalite_propre(cu.nature_collectivite)) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total_autre
FROM stats.monthly_bucket m
UNION ALL
SELECT m.first_day                              AS mois,
       r.code                                   AS code_region,
       NULL::character varying                  AS code_departement,
       (SELECT count(*) FILTER (WHERE cu.region_code::text = r.code::text) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total,
       (SELECT count(*) FILTER (WHERE stats.is_fiscalite_propre(cu.nature_collectivite) AND
                                      cu.region_code::text = r.code::text) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total_epci,
       (SELECT count(*) FILTER (WHERE cu.type_collectivite = 'syndicat'::type_collectivite AND
                                      cu.region_code::text = r.code::text) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total_syndicat,
       (SELECT count(*) FILTER (WHERE cu.type_collectivite = 'commune'::type_collectivite AND
                                      cu.region_code::text = r.code::text) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total_commune,
       (SELECT count(*) FILTER (WHERE cu.type_collectivite <> 'commune'::type_collectivite AND
                                      cu.type_collectivite <> 'syndicat'::type_collectivite AND
                                      NOT stats.is_fiscalite_propre(cu.nature_collectivite) AND
                                      cu.region_code::text = r.code::text) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total_autre
FROM imports.region r
       JOIN stats.monthly_bucket m ON true
UNION ALL
SELECT m.first_day                              AS mois,
       NULL::character varying                  AS code_region,
       d.code                                   AS code_departement,
       (SELECT count(*) FILTER (WHERE cu.departement_code::text = d.code::text) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total,
       (SELECT count(*) FILTER (WHERE stats.is_fiscalite_propre(cu.nature_collectivite) AND
                                      cu.departement_code::text = d.code::text) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total_epci,
       (SELECT count(*) FILTER (WHERE cu.type_collectivite = 'syndicat'::type_collectivite AND
                                      cu.departement_code::text = d.code::text) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total_syndicat,
       (SELECT count(*) FILTER (WHERE cu.type_collectivite = 'commune'::type_collectivite AND
                                      cu.departement_code::text = d.code::text) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total_commune,
       (SELECT count(*) FILTER (WHERE cu.type_collectivite <> 'commune'::type_collectivite AND
                                      cu.type_collectivite <> 'syndicat'::type_collectivite AND
                                      NOT stats.is_fiscalite_propre(cu.nature_collectivite) AND
                                      cu.departement_code::text = d.code::text) AS count
        FROM stats.collectivite_utilisateur cu
        WHERE cu.date_activation <= m.last_day) AS total_autre
FROM imports.departement d
       JOIN stats.monthly_bucket m ON true;

-- view stats_locales_evolution_total_activation
create view stats_locales_evolution_total_activation
    (mois, code_region, code_departement, total, total_epci, total_syndicat, total_commune, total_autre) as
SELECT locales_evolution_total_activation.mois,
       locales_evolution_total_activation.code_region,
       locales_evolution_total_activation.code_departement,
       locales_evolution_total_activation.total,
       locales_evolution_total_activation.total_epci,
       locales_evolution_total_activation.total_syndicat,
       locales_evolution_total_activation.total_commune,
       locales_evolution_total_activation.total_autre
FROM stats.locales_evolution_total_activation;

------------------------
-- REVERT LES TABLES  --
------------------------

drop trigger after_insert_add_competence on collectivite;
create trigger after_insert_add_competence
  after insert
  on epci
  for each row
execute procedure ajoute_competences_banatic();


alter table collectivite
  drop column nom,
  drop column type,
  drop column commune_code,
  drop column siren,
  drop column departement_code,
  drop column region_code,
  drop column nature_insee,
  drop column population;

drop table collectivite_banatic_type;

COMMIT;
