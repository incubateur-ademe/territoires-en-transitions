-- Deploy tet:labellisation/parcours to pg
-- requires: labellisation/prerequis

BEGIN;

create or replace function labellisation_parcours(collectivite_id integer)
    returns TABLE(referentiel referentiel, etoiles labellisation.etoile, completude_ok boolean, critere_score jsonb, criteres_action jsonb, rempli boolean, calendrier text, demande jsonb, labellisation jsonb, audit jsonb)
    security definer
    language sql
BEGIN ATOMIC
WITH etoiles AS (
    SELECT etoiles.referentiel,
           etoiles.etoile_labellise,
           etoiles.prochaine_etoile_labellisation,
           etoiles.etoile_score_possible,
           etoiles.etoile_objectif
    FROM labellisation.etoiles(labellisation_parcours.collectivite_id) etoiles(referentiel, etoile_labellise, prochaine_etoile_labellisation, etoile_score_possible, etoile_objectif)
), all_critere AS (
    SELECT critere_action.referentiel,
           critere_action.etoiles,
           critere_action.action_id,
           critere_action.formulation,
           critere_action.score_realise,
           critere_action.min_score_realise,
           critere_action.score_programme,
           critere_action.min_score_programme,
           critere_action.atteint,
           critere_action.prio
    FROM labellisation.critere_action(labellisation_parcours.collectivite_id) critere_action(referentiel, etoiles, action_id, formulation, score_realise, min_score_realise, score_programme, min_score_programme, atteint, prio)
), current_critere AS (
    SELECT c.referentiel,
           c.etoiles,
           c.action_id,
           c.formulation,
           c.score_realise,
           c.min_score_realise,
           c.score_programme,
           c.min_score_programme,
           c.atteint,
           c.prio
    FROM (all_critere c
        JOIN etoiles e_1 ON (((e_1.referentiel = c.referentiel) AND (e_1.etoile_objectif >= c.etoiles))))
), criteres AS (
    SELECT ral.referentiel,
           ral.atteints,
           ral.liste
    FROM ( SELECT c.referentiel,
                  bool_and(c.atteint) AS atteints,
                  jsonb_agg(jsonb_build_object('formulation', c.formulation, 'prio', c.prio, 'action_id', c.action_id, 'rempli', c.atteint, 'etoile', c.etoiles, 'action_identifiant', ad.identifiant, 'statut_ou_score',
                                               CASE
                                                   WHEN ((c.min_score_realise = (100)::double precision) AND (c.min_score_programme IS NULL)) THEN 'Fait'::text
                                                   WHEN ((c.min_score_realise = (100)::double precision) AND (c.min_score_programme = (100)::double precision)) THEN 'Programmé ou fait'::text
                                                   WHEN ((c.min_score_realise IS NOT NULL) AND (c.min_score_programme IS NULL)) THEN (c.min_score_realise || '% fait minimum'::text)
                                                   ELSE (((c.min_score_realise || '% fait minimum ou '::text) || c.min_score_programme) || '% programmé minimum'::text)
                                                   END)) AS liste
           FROM (current_critere c
               JOIN action_definition ad ON (((c.action_id)::text = (ad.action_id)::text)))
           GROUP BY c.referentiel) ral
)
SELECT e.referentiel,
       e.etoile_objectif,
       rs.complet AS completude_ok,
       jsonb_build_object('score_a_realiser', cs.score_a_realiser, 'score_fait', cs.score_fait, 'atteint', cs.atteint, 'etoiles', cs.etoile_objectif) AS critere_score,
       criteres.liste AS criteres_action,
       (criteres.atteints AND cs.atteint AND
        CASE
            WHEN (cot.* IS NOT NULL) THEN true
            ELSE cf.atteint
            END) AS rempli,
       calendrier.information,
       to_jsonb(demande.*) AS to_jsonb,
       to_jsonb(labellisation.*) AS to_jsonb,
       to_jsonb(audit.*) AS to_jsonb
FROM (((((((((etoiles e
    JOIN criteres ON ((criteres.referentiel = e.referentiel)))
    LEFT JOIN labellisation.referentiel_score(labellisation_parcours.collectivite_id) rs(referentiel, score_fait, score_programme, completude, complet) ON ((rs.referentiel = e.referentiel)))
    LEFT JOIN labellisation.critere_score_global(labellisation_parcours.collectivite_id) cs(referentiel, etoile_objectif, score_a_realiser, score_fait, atteint) ON ((cs.referentiel = e.referentiel)))
    LEFT JOIN labellisation.critere_fichier(labellisation_parcours.collectivite_id) cf(referentiel, preuve_nombre, atteint) ON ((cf.referentiel = e.referentiel)))
    LEFT JOIN labellisation_calendrier calendrier ON ((calendrier.referentiel = e.referentiel)))
    LEFT JOIN cot ON ((cot.collectivite_id = labellisation_parcours.collectivite_id)))
    LEFT JOIN LATERAL ( SELECT d.id,
                               d.en_cours,
                               d.collectivite_id,
                               d.referentiel,
                               d.etoiles,
                               d.date,
                               d.sujet
                        FROM labellisation_demande(labellisation_parcours.collectivite_id, e.referentiel) d(id, en_cours, collectivite_id, referentiel, etoiles, date, sujet, modified_at, envoyee_le, demandeur)) demande ON (true))
    LEFT JOIN LATERAL ( SELECT a.id,
                               a.collectivite_id,
                               a.referentiel,
                               a.demande_id,
                               a.date_debut,
                               a.date_fin,
                               a.valide
                        FROM labellisation.current_audit(labellisation_parcours.collectivite_id, e.referentiel) a(id, collectivite_id, referentiel, demande_id, date_debut, date_fin, valide)) audit ON (true))
    LEFT JOIN LATERAL ( SELECT l.id,
                               l.collectivite_id,
                               l.referentiel,
                               l.obtenue_le,
                               l.annee,
                               l.etoiles,
                               l.score_realise,
                               l.score_programme
                        FROM labellisation l
                        WHERE ((l.collectivite_id = labellisation_parcours.collectivite_id) AND (l.referentiel = e.referentiel))
                        ORDER BY l.obtenue_le DESC
                        LIMIT 1) labellisation ON (true))
WHERE (est_verifie() OR is_service_role() OR have_lecture_acces(labellisation_parcours.collectivite_id));
END;

COMMIT;
