-- Revert tet:delete-referentiels-old-views from pg
-- Recreates all dropped objects in reverse dependency order.
-- Note: test_write_scores and test.generate_scores definitions not found in sqitch history (used in tests only).

BEGIN;

-- =============================================================================
-- 1. private.action_score TABLE (base for convert_client_scores, score_summary_of)
-- =============================================================================
CREATE TABLE IF NOT EXISTS private.action_score
(
    referentiel                    referentiel NOT NULL,
    action_id                      action_id   NOT NULL,
    concerne                       boolean     NOT NULL DEFAULT true,
    desactive                      boolean     NOT NULL DEFAULT false,
    point_fait                     float       NOT NULL DEFAULT 0.0,
    point_pas_fait                 float       NOT NULL DEFAULT 0.0,
    point_potentiel                float       NOT NULL DEFAULT 0.0,
    point_programme                float       NOT NULL DEFAULT 0.0,
    point_referentiel              float       NOT NULL DEFAULT 0.0,
    total_taches_count             float       NOT NULL DEFAULT 0.0,
    point_non_renseigne            float       NOT NULL DEFAULT 0.0,
    point_potentiel_perso          float                DEFAULT 0.0,
    completed_taches_count         float       NOT NULL DEFAULT 0.0,
    fait_taches_avancement         float       NOT NULL DEFAULT 0.0,
    pas_fait_taches_avancement     float       NOT NULL DEFAULT 0.0,
    programme_taches_avancement     float       NOT NULL DEFAULT 0.0,
    pas_concerne_taches_avancement float       NOT NULL DEFAULT 0.0,
    renseigne                      boolean     NOT NULL DEFAULT true
);
COMMENT ON TABLE private.action_score IS 'A score related to an action. Used for typing, not storing actual data.';

-- =============================================================================
-- 2. private.convert_client_scores (depends on private.action_score)
-- =============================================================================
CREATE OR REPLACE FUNCTION private.convert_client_scores(scores jsonb)
    RETURNS SETOF private.action_score
    STABLE
    LANGUAGE sql
AS
$$
SELECT (SELECT referentiel FROM public.action_relation ar WHERE ar.id = (score ->> 'action_id')),
       (score ->> 'action_id')::public.action_id,
       (score ->> 'concerne')::boolean,
       (score ->> 'desactive')::boolean,
       (score ->> 'point_fait')::float,
       (score ->> 'point_pas_fait')::float,
       (score ->> 'point_potentiel')::float,
       (score ->> 'point_programme')::float,
       (score ->> 'point_referentiel')::float,
       (score ->> 'total_taches_count')::integer,
       (score ->> 'point_non_renseigne')::float,
       (score ->> 'point_potentiel_perso')::float,
       (score ->> 'completed_taches_count')::integer,
       (score ->> 'fait_taches_avancement')::float,
       (score ->> 'pas_fait_taches_avancement')::float,
       (score ->> 'programme_taches_avancement')::float,
       (score ->> 'pas_concerne_taches_avancement')::float,
       (score ->> 'renseigne')::boolean
FROM jsonb_array_elements(scores) AS score
$$;
COMMENT ON FUNCTION private.convert_client_scores IS 'Convert json data from business to typed scores.';

-- =============================================================================
-- 3. private.score_summary_of (depends on private.action_score)
-- =============================================================================
CREATE OR REPLACE FUNCTION private.score_summary_of(score private.action_score)
    RETURNS TABLE
            (
                referentiel          referentiel,
                action_id            action_id,
                proportion_fait      float,
                proportion_programme float,
                completude           float,
                complete             boolean,
                concerne             boolean,
                desactive            boolean
            )
AS
$$
SELECT score.referentiel,
       score.action_id,
       CASE
           WHEN (score.point_potentiel)::float = 0.0
               THEN (score.fait_taches_avancement)::float / (score.total_taches_count)::float
           ELSE (score.point_fait)::float / (score.point_potentiel)::float
           END,
       CASE
           WHEN (score.point_potentiel)::float = 0.0
               THEN (score.programme_taches_avancement)::float / (score.total_taches_count)::float
           ELSE (score.point_programme)::float / (score.point_potentiel)::float
           END,
       CASE
           WHEN (score.total_taches_count)::float = 0.0 THEN 0.0
           ELSE (score.completed_taches_count)::float / (score.total_taches_count)::float
           END,
       (score.completed_taches_count)::float = (score.total_taches_count)::float,
       (score.concerne)::boolean,
       (score.desactive)::boolean
$$
    LANGUAGE sql STABLE;
COMMENT ON FUNCTION private.score_summary_of IS 'Fonction utilitaire pour obtenir un résumé d''un score donné.';

-- =============================================================================
-- 4. private.action_score FUNCTION (depends on convert_client_scores)
-- =============================================================================
CREATE OR REPLACE FUNCTION private.action_score(collectivite_id integer, referentiel referentiel)
    RETURNS SETOF private.action_score
AS
$$
SELECT (private.convert_client_scores(cs.scores)).*
FROM client_scores cs
WHERE cs.collectivite_id = action_score.collectivite_id
  AND cs.referentiel = action_score.referentiel
$$ LANGUAGE sql;

-- =============================================================================
-- 5. tabular_score type + private.to_tabular_score (for action_statuts, etc.)
-- =============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tabular_score') THEN
        CREATE TYPE tabular_score AS (
            referentiel             referentiel,
            action_id               action_id,
            score_realise           double precision,
            score_programme         double precision,
            score_realise_plus_programme double precision,
            score_pas_fait          double precision,
            score_non_renseigne     double precision,
            points_restants         double precision,
            points_realises         double precision,
            points_programmes       double precision,
            points_max_personnalises double precision,
            points_max_referentiel  double precision,
            avancement              avancement,
            concerne                bool,
            desactive               bool
        );
        COMMENT ON TYPE tabular_score IS 'Un score utilisé pour être affiché dans le client.';
    END IF;
END
$$;

CREATE OR REPLACE FUNCTION private.to_tabular_score(action_score private.action_score)
    RETURNS tabular_score
    LANGUAGE sql
BEGIN
    ATOMIC
    SELECT action_score.referentiel,
           action_score.action_id,
           CASE WHEN action_score.point_potentiel = 0 THEN 0
                ELSE action_score.point_fait / action_score.point_potentiel END,
           CASE WHEN action_score.point_potentiel = 0 THEN 0
                ELSE action_score.point_programme / action_score.point_potentiel END,
           CASE WHEN action_score.point_potentiel = 0 THEN 0
                ELSE (action_score.point_fait + action_score.point_programme) / action_score.point_potentiel END,
           CASE WHEN action_score.point_potentiel = 0 THEN 0
                ELSE action_score.point_pas_fait / action_score.point_potentiel END,
           CASE WHEN action_score.point_potentiel = 0 THEN 0
                ELSE action_score.point_non_renseigne / action_score.point_potentiel END,
           GREATEST(action_score.point_potentiel - action_score.point_fait, 0),
           action_score.point_fait,
           action_score.point_programme,
           action_score.point_potentiel,
           action_score.point_referentiel,
           CASE
               WHEN action_score.fait_taches_avancement = 1 THEN 'fait'::avancement
               WHEN action_score.programme_taches_avancement = 1 THEN 'programme'::avancement
               WHEN action_score.pas_fait_taches_avancement = 1 THEN 'pas_fait'::avancement
               WHEN action_score.fait_taches_avancement + action_score.programme_taches_avancement +
                    action_score.pas_fait_taches_avancement = 0 THEN 'non_renseigne'::avancement
               ELSE 'detaille'::avancement END,
           action_score.concerne,
           action_score.desactive;
END;
COMMENT ON FUNCTION private.to_tabular_score IS 'Convertit un action score en score pour les vues tabulaires.';

-- =============================================================================
-- 6. private.referentiel_progress
-- =============================================================================
CREATE OR REPLACE FUNCTION private.referentiel_progress(collectivite_id integer)
    RETURNS TABLE
            (
                referentiel     referentiel,
                score_fait      float,
                score_programme float,
                completude     float,
                complet        boolean,
                concerne       boolean
            )
AS
$$
SELECT cs.referentiel,
       ss.proportion_fait,
       ss.proportion_programme,
       ss.completude,
       ss.complete,
       ss.concerne
FROM (SELECT * FROM client_scores WHERE client_scores.collectivite_id = referentiel_progress.collectivite_id) cs
         JOIN LATERAL (SELECT * FROM private.convert_client_scores(cs.scores)) s ON true
         JOIN private.score_summary_of(s) ss ON true
WHERE s.action_id = cs.referentiel::action_id
$$ LANGUAGE sql;
COMMENT ON FUNCTION private.referentiel_progress IS 'Les progrès d''une collectivité par référentiel.';

-- =============================================================================
-- 7. private.upsert_actions, private.upsert_referentiel_after_json_insert
-- =============================================================================
CREATE OR REPLACE FUNCTION private.upsert_actions(definitions jsonb, children jsonb)
    RETURNS void
AS
$$
DECLARE
    action jsonb;
    parent jsonb;
    child_id text;
BEGIN
    FOR parent IN SELECT * FROM jsonb_array_elements(children)
        LOOP
            INSERT INTO action_relation (id, referentiel, parent)
            SELECT (parent ->> 'referentiel')::action_id,
                   (parent ->> 'referentiel')::referentiel,
                   NULL
            ON CONFLICT DO NOTHING;

            FOR child_id IN SELECT * FROM jsonb_array_elements_text(parent -> 'children')
                LOOP
                    INSERT INTO action_relation (id, referentiel, parent)
                    SELECT child_id::action_id,
                           (parent ->> 'referentiel')::referentiel,
                           (parent ->> 'action_id')::action_id
                    ON CONFLICT DO NOTHING;
                END LOOP;
        END LOOP;

    FOR action IN SELECT * FROM jsonb_array_elements(definitions)
        LOOP
            INSERT INTO action_definition (action_id, referentiel, identifiant, nom, description, contexte, exemples,
                                          ressources, reduction_potentiel, perimetre_evaluation, preuve, points,
                                          pourcentage, categorie)
            SELECT action ->> 'action_id',
                   (action ->> 'referentiel')::referentiel,
                   action ->> 'identifiant',
                   action ->> 'nom',
                   action ->> 'description',
                   action ->> 'contexte',
                   action ->> 'exemples',
                   action ->> 'ressources',
                   action ->> 'reduction_potentiel',
                   action ->> 'perimetre_evaluation',
                   '',
                   (action ->> 'md_points')::float,
                   (action ->> 'md_pourcentage')::float,
                   (action ->> 'categorie')::action_categorie
            ON CONFLICT (action_id) DO UPDATE
                SET referentiel = EXCLUDED.referentiel,
                    identifiant = EXCLUDED.identifiant,
                    nom = EXCLUDED.nom,
                    description = EXCLUDED.description,
                    contexte = EXCLUDED.contexte,
                    exemples = EXCLUDED.exemples,
                    ressources = EXCLUDED.ressources,
                    reduction_potentiel = EXCLUDED.reduction_potentiel,
                    perimetre_evaluation = EXCLUDED.perimetre_evaluation,
                    preuve = EXCLUDED.preuve,
                    points = EXCLUDED.points,
                    pourcentage = EXCLUDED.pourcentage,
                    categorie = EXCLUDED.categorie;

            INSERT INTO action_computed_points (action_id, value)
            SELECT action ->> 'action_id',
                   (action ->> 'computed_points')::float
            ON CONFLICT (action_id) DO UPDATE SET value = EXCLUDED.value;
        END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION private.upsert_actions IS 'Met à jour les définitions des actions qui constituent un référentiel.';

CREATE OR REPLACE FUNCTION private.upsert_referentiel_after_json_insert()
    RETURNS trigger
AS
$$
BEGIN
    PERFORM private.upsert_actions(NEW.definitions, NEW.children);
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'evaluation' AND matviewname = 'service_referentiel') THEN
        REFRESH MATERIALIZED VIEW evaluation.service_referentiel;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 8. labellisation.action_snippet (depends on private.action_score function)
-- =============================================================================
CREATE OR REPLACE VIEW labellisation.action_snippet AS
WITH ref AS (SELECT unnest(enum_range(NULL::referentiel)) AS referentiel)
SELECT s.action_id,
       c.id  AS collectivite_id,
       jsonb_build_object(
               'action_id', s.action_id,
               'identifiant', ad.identifiant,
               'referentiel', s.referentiel,
               'desactive', s.desactive,
               'concerne', s.concerne,
               'nom', ad.nom,
               'description', ad.description
           ) AS snippet
FROM collectivite c
         JOIN ref r ON true
         LEFT JOIN LATERAL (SELECT * FROM private.action_score(c.id, r.referentiel)) AS s ON true
         LEFT JOIN action_definition ad ON s.action_id = ad.action_id;

-- =============================================================================
-- 9. labellisation.update_audit_score_on_personnalisation, labellisation.update_audit_scores
-- =============================================================================
CREATE OR REPLACE FUNCTION labellisation.update_audit_score_on_personnalisation()
    RETURNS trigger
AS
$$
BEGIN
    PERFORM (
        WITH ref AS (SELECT unnest(enum_range(NULL::referentiel)) AS referentiel),
             audit AS (SELECT ca.id
                       FROM ref
                                JOIN labellisation.current_audit(NEW.collectivite_id, ref.referentiel) ca ON true),
             query AS (SELECT labellisation.evaluate_audit_statuts(audit.id, true, 'pre_audit_scores') AS id
                       FROM audit)
        SELECT COUNT(*)
        FROM query
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION labellisation.update_audit_scores()
    RETURNS trigger
AS
$$
BEGIN
    PERFORM labellisation.evaluate_audit_statuts(NEW.id, true, 'pre_audit_scores');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_write_update_audit_scores ON labellisation.audit;
CREATE TRIGGER after_write_update_audit_scores
    AFTER INSERT OR UPDATE
    ON labellisation.audit
    FOR EACH ROW
EXECUTE PROCEDURE labellisation.update_audit_scores();

DROP TRIGGER IF EXISTS after_write_update_audit_scores ON personnalisation_consequence;
CREATE TRIGGER after_write_update_audit_scores
    AFTER INSERT OR UPDATE
    ON personnalisation_consequence
    FOR EACH ROW
EXECUTE PROCEDURE labellisation.update_audit_score_on_personnalisation();

-- =============================================================================
-- 10. historique.action_statuts_at
-- =============================================================================
CREATE OR REPLACE FUNCTION historique.action_statuts_at(
    collectivite_id integer,
    ref referentiel,
    "time" timestamptz
)
    RETURNS TABLE
            (
                id                     bigint,
                collectivite_id       integer,
                action_id             action_id,
                avancement             avancement,
                previous_avancement   avancement,
                avancement_detaille   double precision[],
                previous_avancement_detaille double precision[],
                concerne               boolean,
                previous_concerne     boolean,
                modified_by            uuid,
                previous_modified_by  uuid,
                modified_at           timestamptz,
                previous_modified_at  timestamptz
            )
AS
$$
SELECT s.id,
       s.collectivite_id,
       ar.id AS action_id,
       s.avancement,
       s.previous_avancement,
       s.avancement_detaille,
       s.previous_avancement_detaille,
       s.concerne,
       s.previous_concerne,
       s.modified_by,
       s.previous_modified_by,
       s.modified_at,
       s.previous_modified_at
FROM historique.action_statut s
         JOIN action_relation ar ON ar.referentiel = action_statuts_at.ref
    AND s.action_id::text LIKE ar.id::text || '%'
WHERE s.collectivite_id = action_statuts_at.collectivite_id
  AND s.modified_at <= action_statuts_at.time
  AND (s.previous_modified_at IS NULL OR s.previous_modified_at <= action_statuts_at.time)
  AND NOT EXISTS (
    SELECT 1
    FROM historique.action_statut later
    WHERE later.collectivite_id = s.collectivite_id
      AND later.action_id = s.action_id
      AND later.modified_at > s.modified_at
      AND later.modified_at <= action_statuts_at.time
);
$$ LANGUAGE sql STABLE;
COMMENT ON FUNCTION historique.action_statuts_at IS 'Statuts des actions à une date donnée.';

-- =============================================================================
-- 11. labellisation.json_action_statuts_at
-- =============================================================================
CREATE OR REPLACE FUNCTION labellisation.json_action_statuts_at(
    collectivite_id integer,
    referentiel referentiel,
    date_at timestamptz
)
    RETURNS jsonb
    STABLE
AS
$$
SELECT jsonb_agg(evaluation.convert_statut(h.action_id, h.avancement, h.avancement_detaille, h.concerne))
FROM historique.action_statuts_at(json_action_statuts_at.collectivite_id,
                                  json_action_statuts_at.referentiel,
                                  json_action_statuts_at.date_at) h
         LEFT JOIN action_relation ar ON h.action_id::text = ar.id::text
$$ LANGUAGE sql;
COMMENT ON FUNCTION labellisation.json_action_statuts_at IS 'Les statuts des actions au format JSON à une date.';

-- =============================================================================
-- 12. labellisation.etoiles, referentiel_score, critere_score_global
-- =============================================================================
CREATE OR REPLACE FUNCTION labellisation.referentiel_score(collectivite_id integer)
    RETURNS TABLE
            (
                referentiel    referentiel,
                score_fait     float,
                score_programme float,
                completude    float,
                complet       boolean
            )
AS
$$
WITH ref AS (SELECT unnest(enum_range(NULL::referentiel)) AS referentiel),
     scores AS (SELECT s.*
                FROM ref
                         LEFT JOIN client_scores cs ON cs.referentiel = ref.referentiel
                         JOIN private.convert_client_scores(cs.scores) s ON true
                WHERE cs.collectivite_id = referentiel_score.collectivite_id)
SELECT s.referentiel,
       ss.proportion_fait,
       ss.proportion_programme,
       ss.completude,
       ss.complete
FROM scores s
         JOIN private.score_summary_of(s) ss ON true
WHERE s.action_id = s.referentiel::action_id;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION labellisation.etoiles(collectivite_id integer)
    RETURNS TABLE
            (
                referentiel                referentiel,
                etoile_labellise           labellisation.etoile,
                prochaine_etoile_labellisation labellisation.etoile,
                etoile_score_possible      labellisation.etoile,
                etoile_objectif            labellisation.etoile
            )
AS
$$
WITH ref AS (SELECT unnest(enum_range(NULL::referentiel)) AS referentiel),
     l_etoile AS (SELECT r.referentiel, em.etoile, em.prochaine_etoile
                  FROM ref r
                           JOIN public.labellisation l ON r.referentiel = l.referentiel AND l.collectivite_id = etoiles.collectivite_id
                           JOIN labellisation.etoile_meta em ON em.etoile = l.etoiles::varchar::labellisation.etoile),
     score AS (SELECT * FROM labellisation.referentiel_score(etoiles.collectivite_id)),
     s_etoile AS (SELECT r.referentiel,
                         CASE WHEN s.complet THEN max(em.etoile) END AS etoile_atteinte
                  FROM ref r
                           JOIN score s ON r.referentiel = s.referentiel
                           JOIN labellisation.etoile_meta em ON em.min_realise_score <= s.score_fait
                  GROUP BY r.referentiel, s.complet)
SELECT s.referentiel,
       l.etoile AS etoile_labellise,
       l.prochaine_etoile AS prochaine_etoile_labellisation,
       s.etoile_atteinte AS etoile_score_possible,
       greatest(l.etoile, l.prochaine_etoile, s.etoile_atteinte, '1') AS etoile_objectif
FROM s_etoile s
         LEFT JOIN l_etoile l ON l.referentiel = s.referentiel;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION labellisation.critere_score_global(collectivite_id integer)
    RETURNS TABLE
            (
                referentiel     referentiel,
                etoile_objectif labellisation.etoile,
                score_a_realiser float,
                score_fait      float,
                atteint        bool
            )
AS
$$
WITH score AS (SELECT * FROM labellisation.referentiel_score(critere_score_global.collectivite_id))
SELECT e.referentiel,
       e.etoile_objectif,
       em.min_realise_score,
       s.score_fait,
       s.score_fait >= em.min_realise_score
FROM labellisation.etoiles(critere_score_global.collectivite_id) AS e
         LEFT JOIN labellisation.etoile_meta em ON em.etoile = e.etoile_objectif
         LEFT JOIN score s ON e.referentiel = s.referentiel
$$ LANGUAGE sql;

-- =============================================================================
-- 13. labellisation_parcours
-- =============================================================================
CREATE OR REPLACE FUNCTION labellisation_parcours(collectivite_id integer)
    RETURNS TABLE
            (
                referentiel     referentiel,
                etoiles        labellisation.etoile,
                completude_ok  boolean,
                critere_score  jsonb,
                criteres_action jsonb,
                rempli         boolean,
                calendrier     text,
                demande        jsonb,
                labellisation  jsonb,
                audit          jsonb
            )
    SECURITY DEFINER
AS
$$
WITH etoiles AS (SELECT * FROM labellisation.etoiles(labellisation_parcours.collectivite_id)),
     critere_action AS (SELECT * FROM labellisation.critere_action(labellisation_parcours.collectivite_id))
SELECT e.referentiel,
       e.etoile_objectif AS etoiles,
       (SELECT bool_and(c.atteint) FROM critere_action c WHERE c.referentiel = e.referentiel AND c.etoiles = e.etoile_objectif) AS completude_ok,
       (SELECT jsonb_build_object('score_a_realiser', cs.score_a_realiser, 'score_fait', cs.score_fait, 'atteint', cs.atteint, 'etoiles', cs.etoile_objectif)
        FROM labellisation.critere_score_global(labellisation_parcours.collectivite_id) cs
        WHERE cs.referentiel = e.referentiel) AS critere_score,
       (SELECT jsonb_agg(jsonb_build_object('formulation', c.formulation, 'prio', c.prio, 'action_id', c.action_id, 'rempli', c.atteint, 'etoile', c.etoiles))
        FROM critere_action c
        WHERE c.referentiel = e.referentiel AND c.etoiles = e.etoile_objectif) AS criteres_action,
       (SELECT cf.atteint
        FROM labellisation.critere_fichier(labellisation_parcours.collectivite_id) cf
        WHERE cf.referentiel = e.referentiel) AS rempli,
       lc.information AS calendrier,
       (SELECT jsonb_agg(to_jsonb(d)) FROM labellisation_demande(labellisation_parcours.collectivite_id, e.referentiel) d) AS demande,
       (SELECT to_jsonb(l) FROM labellisation l
        WHERE l.collectivite_id = labellisation_parcours.collectivite_id AND l.referentiel = e.referentiel ORDER BY obtenue_le DESC LIMIT 1) AS labellisation,
       (SELECT to_jsonb(a) FROM labellisation.current_audit(labellisation_parcours.collectivite_id, e.referentiel) a) AS audit
FROM etoiles e
         LEFT JOIN labellisation_calendrier lc ON lc.referentiel = e.referentiel;
$$ LANGUAGE sql;

-- =============================================================================
-- 14. action_children, business_action_children
-- =============================================================================
CREATE OR REPLACE VIEW business_action_children AS
SELECT referentiel, id, parent, children.ids AS children
FROM action_relation AS ar
         LEFT JOIN LATERAL (
    SELECT array_agg(action_relation.id) AS ids
    FROM action_relation
    WHERE action_relation.parent = ar.id
    ) AS children ON true;

CREATE OR REPLACE VIEW action_children AS
WITH RECURSIVE actions_from_parents AS (
    SELECT id, referentiel, '{}'::action_id[] AS parents, 0 AS depth
    FROM action_relation
    WHERE action_relation.parent IS NULL
    UNION ALL
    SELECT c.id, c.referentiel, parents || c.parent, depth + 1
    FROM actions_from_parents p
             JOIN action_relation c ON c.parent = p.id
    WHERE NOT c.id = ANY (parents)
),
     parent_children AS (
         SELECT ar.id, array_agg(afp.id) AS children
         FROM action_relation ar
                  JOIN actions_from_parents afp ON ar.id = ANY (afp.parents)
         GROUP BY ar.id
     )
SELECT actions_from_parents.id,
       actions_from_parents.referentiel,
       coalesce(parent_children.children, '{}'::action_id[]) AS children,
       actions_from_parents.depth
FROM actions_from_parents
         LEFT JOIN parent_children ON actions_from_parents.id = parent_children.id
ORDER BY depth;

-- =============================================================================
-- 16. action_discussion_feed, client_action_statut
-- =============================================================================
CREATE OR REPLACE VIEW action_discussion_feed AS
WITH nom_commentaire AS (
         SELECT adc.id,
            adc.created_by,
            adc.created_at,
            adc.discussion_id,
            adc.message,
            utilisateur.modified_by_nom(adc.created_by) AS created_by_nom
           FROM discussion_message adc
        )
 SELECT ad.id,
    ad.collectivite_id,
    ad.action_id,
    ad.created_by,
    ad.created_at,
    ad.modified_at,
    ad.status,
    c.commentaires
   FROM discussion ad
     LEFT JOIN LATERAL ( SELECT array_agg(to_jsonb(nc.*)) AS commentaires
           FROM nom_commentaire nc
          WHERE nc.discussion_id = ad.id) c ON true
  WHERE have_lecture_acces(ad.collectivite_id) OR est_support() OR est_auditeur_action(ad.collectivite_id, ad.action_id);

CREATE OR REPLACE VIEW client_action_statut AS
SELECT collectivite_id, modified_by, action_id, avancement, concerne
FROM action_statut;

-- =============================================================================
-- 17. retool_completude_compute
-- =============================================================================
CREATE OR REPLACE VIEW retool_completude_compute(collectivite_id, nom, completude_eci, completude_cae) AS
WITH active AS (SELECT retool_active_collectivite.collectivite_id, retool_active_collectivite.nom
                FROM retool_active_collectivite),
     completed_eci AS (SELECT c_1.collectivite_id, count(*) AS count
                       FROM active c_1
                                JOIN action_statut s ON s.collectivite_id = c_1.collectivite_id
                                JOIN action_relation r ON r.id::text = s.action_id::text
                       WHERE r.referentiel = 'eci'
                       GROUP BY c_1.collectivite_id),
     eci_count AS (SELECT count(*) AS count
                   FROM action_relation r
                            JOIN action_children c_1 ON r.id::text = c_1.id::text
                   WHERE r.referentiel = 'eci'
                     AND array_length(c_1.children, 1) IS NULL),
     completed_cae AS (SELECT c_1.collectivite_id, count(*) AS count
                       FROM active c_1
                                JOIN action_statut s ON s.collectivite_id = c_1.collectivite_id
                                JOIN action_relation r ON r.id::text = s.action_id::text
                       WHERE r.referentiel = 'cae'
                       GROUP BY c_1.collectivite_id),
     cae_count AS (SELECT count(*) AS count
                   FROM action_relation r
                            JOIN action_children c_1 ON r.id::text = c_1.id::text
                   WHERE r.referentiel = 'cae'
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
WHERE is_service_role();

-- =============================================================================
-- 18. valider_audit, labellisation_cloturer_audit, labellisation_commencer_audit, labellisation_submit_demande, labellisation_validate_audit
-- =============================================================================
CREATE OR REPLACE FUNCTION valider_audit(audit_id integer)
    RETURNS labellisation.audit
AS
$$
DECLARE
    to_return labellisation.audit;
BEGIN
    IF NOT est_auditeur_audit(valider_audit.audit_id) THEN
        PERFORM set_config('response.status', '403', true);
        RAISE 'L''utilisateur n''a pas le droit de valider cet audit.';
    END IF;
    UPDATE labellisation.audit SET valide = true WHERE id = valider_audit.audit_id;
    SELECT * FROM labellisation.audit WHERE id = valider_audit.audit_id LIMIT 1 INTO to_return;
    RETURN to_return;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION labellisation_cloturer_audit(audit_id integer, date_fin timestamptz DEFAULT CURRENT_TIMESTAMP)
    RETURNS labellisation.audit
AS
$$
DECLARE
    audit labellisation.audit;
BEGIN
    IF NOT is_service_role() AND NOT est_auditeur_audit(audit_id) THEN
        PERFORM set_config('response.status', '403', true);
        RAISE 'Seul l''auditeur et le service role peut clôturer l''audit.';
    END IF;
    UPDATE labellisation.audit
    SET date_fin = labellisation_cloturer_audit.date_fin
    WHERE id = audit_id
    RETURNING * INTO audit;
    RETURN audit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION labellisation_commencer_audit(audit_id integer, date_debut timestamptz DEFAULT CURRENT_TIMESTAMP)
    RETURNS labellisation.audit
AS
$$
DECLARE
    audit labellisation.audit;
BEGIN
    IF NOT ((audit_id IN (SELECT aa.audit_id FROM audit_auditeur aa WHERE aa.auditeur = auth.uid())) OR is_service_role()) THEN
        PERFORM set_config('response.status', '403', true);
        RAISE 'L''utilisateur n''a pas de droit en édition sur l''audit.';
    END IF;
    IF (SELECT en_cours FROM labellisation.audit a JOIN labellisation.demande d ON a.demande_id = d.id WHERE a.id = labellisation_commencer_audit.audit_id) THEN
        PERFORM set_config('response.status', '409', true);
        RAISE 'La demande liée à l''audit est en cours, elle n''a pas été envoyée.';
    END IF;
    UPDATE labellisation.audit SET date_debut = labellisation_commencer_audit.date_debut WHERE id = audit_id
    RETURNING * INTO audit;
    RETURN audit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION labellisation_submit_demande(collectivite_id integer, referentiel referentiel, sujet labellisation.sujet_demande, etoiles labellisation.etoile DEFAULT NULL)
    RETURNS labellisation.demande
AS
$$
BEGIN
    IF (sujet = 'cot' AND etoiles IS NOT NULL) OR (sujet != 'cot' AND etoiles IS NULL) THEN
        PERFORM set_config('response.status', '400', true);
        RAISE 'Pour une demande COT, les étoiles sont requises. Pour les autres sujets, elles ne doivent pas être renseignées.';
    END IF;
    INSERT INTO labellisation.demande (collectivite_id, referentiel, sujet, etoiles)
    VALUES (labellisation_submit_demande.collectivite_id, labellisation_submit_demande.referentiel, labellisation_submit_demande.sujet, labellisation_submit_demande.etoiles)
    ON CONFLICT (collectivite_id, referentiel) DO UPDATE
        SET etoiles = EXCLUDED.etoiles,
            sujet = EXCLUDED.sujet,
            envoyee_le = NULL,
            modified_at = now();
    RETURN (SELECT * FROM labellisation.demande
            WHERE collectivite_id = labellisation_submit_demande.collectivite_id
              AND referentiel = labellisation_submit_demande.referentiel
            ORDER BY modified_at DESC LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION labellisation_validate_audit(audit_id integer, valide boolean)
    RETURNS labellisation.audit
AS
$$
BEGIN
    IF NOT est_auditeur_audit(labellisation_validate_audit.audit_id) THEN
        PERFORM set_config('response.status', '403', true);
        RAISE 'L''utilisateur n''a pas le droit de valider cet audit.';
    END IF;
    UPDATE labellisation.audit SET valide = labellisation_validate_audit.valide WHERE id = labellisation_validate_audit.audit_id;
    RETURN (SELECT * FROM labellisation.audit WHERE id = labellisation_validate_audit.audit_id LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 20. evaluation.service_regles VIEW (before function that uses it)
-- =============================================================================
CREATE OR REPLACE VIEW evaluation.service_regles AS
SELECT action_id,
       jsonb_agg(jsonb_build_object('type', pr.type, 'formule', formule)) AS regles
FROM personnalisation_regle pr
GROUP BY action_id;

-- =============================================================================
-- 21. evaluation.service_referentiel, evaluation.service_statuts
-- =============================================================================
CREATE MATERIALIZED VIEW evaluation.service_referentiel AS
WITH computed_points AS (
         SELECT ar.referentiel,
            jsonb_agg(jsonb_build_object('referentiel', ar.referentiel, 'action_id', acp.action_id, 'value', acp.value)) AS data
           FROM action_computed_points acp
             JOIN action_relation ar ON acp.action_id::text = ar.id::text
          GROUP BY ar.referentiel
        ), children AS (
         SELECT ar.referentiel,
            jsonb_agg(jsonb_build_object('referentiel', ar.referentiel, 'action_id', ac.id, 'children', ac.children)) AS data
           FROM action_children ac
             JOIN action_relation ar ON ac.id::text = ar.id::text
          GROUP BY ar.referentiel
        )
 SELECT c.referentiel,
    jsonb_build_object('action_level',
        CASE
            WHEN c.referentiel = 'cae'::referentiel THEN 3
            ELSE 2
        END, 'children', c.data, 'computed_points', p.data) AS data
   FROM children c
     LEFT JOIN computed_points p ON c.referentiel = p.referentiel;

CREATE OR REPLACE VIEW evaluation.service_statuts AS
 SELECT action_statut.collectivite_id,
    action_relation.referentiel,
    jsonb_agg(evaluation.convert_statut(action_statut.action_id, action_statut.avancement, action_statut.avancement_detaille, action_statut.concerne)) AS data
   FROM action_statut
     LEFT JOIN action_relation ON action_statut.action_id::text = action_relation.id::text
  GROUP BY action_statut.collectivite_id, action_relation.referentiel;

-- =============================================================================
-- 22. evaluation.service_regles FUNCTION (uses the view)
-- =============================================================================
CREATE OR REPLACE FUNCTION evaluation.service_regles()
    RETURNS jsonb
    STABLE
BEGIN
    ATOMIC
    SELECT jsonb_agg(sr) FROM evaluation.service_regles sr;
END;
COMMENT ON FUNCTION evaluation.service_regles IS 'Toutes les règles d''évaluation de la vue service_regles.';

-- =============================================================================
-- 23. labellisation.audit_evaluation_payload, audit_personnalisation_payload, evaluate_audit_statuts
-- =============================================================================
CREATE OR REPLACE FUNCTION labellisation.audit_evaluation_payload(audit labellisation.audit, pre_audit boolean, labellisation boolean, OUT referentiel jsonb, OUT statuts jsonb, OUT consequences jsonb)
 RETURNS record
 LANGUAGE sql
 STABLE
BEGIN ATOMIC
 WITH statuts AS (
          SELECT labellisation.json_action_statuts_at((audit_evaluation_payload.audit).collectivite_id, (audit_evaluation_payload.audit).referentiel,
                 CASE
                     WHEN audit_evaluation_payload.pre_audit THEN (audit_evaluation_payload.audit).date_debut
                     WHEN audit_evaluation_payload.labellisation THEN (audit_evaluation_payload.audit).date_cnl
                     ELSE (audit_evaluation_payload.audit).date_fin
                 END) AS data
         )
  SELECT r.data AS referentiel,
     COALESCE(s.data, to_jsonb('{}'::jsonb[])) AS statuts,
     '{}'::jsonb AS consequences
    FROM (evaluation.service_referentiel r
      LEFT JOIN statuts s ON (true))
   WHERE (r.referentiel = (audit_evaluation_payload.audit).referentiel);
END
;

CREATE OR REPLACE FUNCTION labellisation.audit_personnalisation_payload(audit_id integer, pre_audit boolean, scores_table text)
 RETURNS jsonb
 LANGUAGE sql
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
END
;

CREATE OR REPLACE FUNCTION labellisation.evaluate_audit_statuts(audit_id integer, pre_audit boolean, scores_table character varying, OUT request_id bigint)
 RETURNS bigint
 LANGUAGE sql
 SECURITY DEFINER
BEGIN ATOMIC
 SELECT post.post
    FROM ((evaluation.current_service_configuration() conf(evaluation_endpoint, personnalisation_endpoint, created_at)
      JOIN labellisation.audit_personnalisation_payload(evaluate_audit_statuts.audit_id, evaluate_audit_statuts.pre_audit, (evaluate_audit_statuts.scores_table)::text) pp(pp) ON (true))
      JOIN LATERAL net.http_post((conf.personnalisation_endpoint)::text, pp.pp) post(post) ON (true))
   WHERE (conf.* IS NOT NULL);
END
;

-- =============================================================================
-- 24. private.collectivite_scores, collectivite_scores_pre_audit, collectivite_score_comparaison, comparaison_scores_audit
-- =============================================================================
CREATE OR REPLACE FUNCTION private.collectivite_scores(collectivite_id integer, referentiel referentiel)
    RETURNS SETOF tabular_score
BEGIN
    ATOMIC
    SELECT sc.*
    FROM client_scores
             JOIN private.convert_client_scores(client_scores.scores) ccc ON true
             JOIN private.to_tabular_score(ccc) sc ON true
    WHERE client_scores.collectivite_id = collectivite_scores.collectivite_id
      AND client_scores.referentiel = collectivite_scores.referentiel;
END;

CREATE OR REPLACE FUNCTION private.collectivite_scores_pre_audit(collectivite_id integer, referentiel referentiel)
    RETURNS SETOF tabular_score
BEGIN
    ATOMIC
    SELECT sc.*
    FROM pre_audit_scores
             JOIN private.convert_client_scores(pre_audit_scores.scores) ccc ON true
             JOIN private.to_tabular_score(ccc) sc ON true
    WHERE pre_audit_scores.collectivite_id = collectivite_scores_pre_audit.collectivite_id
      AND pre_audit_scores.referentiel = collectivite_scores_pre_audit.referentiel;
END;

CREATE OR REPLACE FUNCTION private.collectivite_score_comparaison(collectivite_id integer, referentiel referentiel)
    RETURNS TABLE(referentiel referentiel, courant tabular_score, pre_audit tabular_score)
BEGIN
    ATOMIC
    WITH courant AS (SELECT private.collectivite_scores(collectivite_score_comparaison.collectivite_id, collectivite_score_comparaison.referentiel) AS score),
         pre_audit AS (SELECT private.collectivite_scores_pre_audit(collectivite_score_comparaison.collectivite_id, collectivite_score_comparaison.referentiel) AS score)
    SELECT collectivite_score_comparaison.referentiel,
           courant.score,
           pre_audit.score
    FROM courant
             JOIN pre_audit ON (pre_audit.score).action_id = (courant.score).action_id;
END;

CREATE OR REPLACE VIEW comparaison_scores_audit AS
SELECT c.id AS collectivite_id, sc.referentiel, (sc.courant).action_id AS action_id, sc.courant, sc.pre_audit
FROM collectivite c
         CROSS JOIN (SELECT unnest(enum_range(NULL::referentiel)) AS referentiel) ref
         JOIN LATERAL private.collectivite_score_comparaison(c.id, ref.referentiel) sc ON true
ORDER BY collectivite_id, referentiel, naturalsort((sc.courant).action_id);

-- =============================================================================
-- 25. private.action_scores view
-- =============================================================================
CREATE OR REPLACE VIEW private.action_scores AS
SELECT cs.collectivite_id, unpacked.*
FROM client_scores cs
         JOIN LATERAL (SELECT * FROM private.convert_client_scores(cs.scores)) unpacked ON true;

-- =============================================================================
-- 26. public.retool_score
-- =============================================================================
CREATE OR REPLACE VIEW retool_score AS
 SELECT c.collectivite_id,
    c.nom AS "Collectivité",
    d.referentiel,
    d.identifiant AS "Identifiant",
    d.nom AS "Titre",
    sc.point_potentiel AS "Points potentiels",
    sc.point_fait AS "Points realisés",
        CASE
            WHEN sc.point_potentiel = 0::double precision THEN 0::double precision
            ELSE sc.point_fait / sc.point_potentiel * 100::double precision
        END AS "Pourcentage réalisé",
    sc.point_programme AS "Points programmés",
        CASE
            WHEN sc.point_programme = 0::double precision THEN 0::double precision
            ELSE sc.point_programme / sc.point_potentiel * 100::double precision
        END AS "Pourcentage programmé",
        CASE
            WHEN sc.point_potentiel = 0::double precision THEN 0::double precision
            ELSE sc.point_non_renseigne / sc.point_potentiel * 100::double precision
        END AS "Pourcentage non renseigné",
        CASE
            WHEN NOT sc.concerne OR sc.desactive THEN 'Non concerné'::character varying
            WHEN sc.completed_taches_count = 0::double precision THEN 'Non renseigné'::character varying
            ELSE COALESCE(s.avancement::character varying, ''::character varying)
        END AS "Avancement",
        CASE
            WHEN ah.type = 'sous-action'::action_type THEN COALESCE(ac.commentaire || '
'::text, ''::text) || (( SELECT COALESCE(string_agg('- '::text || a.commentaire, '
'::text), ''::text) AS "coalesce"
               FROM action_commentaire a
              WHERE a.collectivite_id = c.collectivite_id AND (a.action_id::text = ANY (ah.descendants::text[])) AND a.commentaire <> ''::text))
            ELSE ac.commentaire
        END AS "Commentaires fusionnés",
    ac.commentaire AS "Commentaire",
    to_char(s.modified_at, 'DD-MM-YYY'::text) AS "Modifié le"
   FROM named_collectivite c
     LEFT JOIN action_definition d ON true
     JOIN private.action_hierarchy ah ON d.action_id::text = ah.action_id::text
     LEFT JOIN action_statut s ON c.collectivite_id = s.collectivite_id AND s.action_id::text = d.action_id::text
     LEFT JOIN private.action_scores sc ON c.collectivite_id = sc.collectivite_id AND sc.action_id::text = d.action_id::text
     LEFT JOIN action_commentaire ac ON d.action_id::text = ac.action_id::text AND c.collectivite_id = ac.collectivite_id
  WHERE is_service_role()
  ORDER BY c.collectivite_id, d.referentiel, (naturalsort(d.identifiant));

-- =============================================================================
-- 27. action_statuts (depends on action_referentiel, convert_client_scores, to_tabular_score)
-- =============================================================================
CREATE OR REPLACE VIEW action_statuts AS
SELECT c.id AS collectivite_id,
       d.action_id,
       client_scores.referentiel,
       d.type,
       d.descendants,
       d.ascendants,
       d.depth,
       d.have_children,
       d.identifiant,
       d.nom,
       d.description,
       d.have_exemples,
       d.have_preuve,
       d.have_ressources,
       d.have_reduction_potentiel,
       d.have_perimetre_evaluation,
       d.have_contexte,
       d.phase,
       sc.score_realise,
       sc.score_programme,
       sc.score_realise_plus_programme,
       sc.score_pas_fait,
       sc.score_non_renseigne,
       sc.points_restants,
       sc.points_realises,
       sc.points_programmes,
       sc.points_max_personnalises,
       sc.points_max_referentiel,
       s.avancement,
       s.avancement_detaille,
       cs.avancements AS avancement_descendants,
       coalesce((NOT s.concerne), cs.non_concerne, false) AS non_concerne,
       p.avancement AS avancement_parent
FROM collectivite c
         JOIN client_scores ON client_scores.collectivite_id = c.id
         JOIN LATERAL private.convert_client_scores(client_scores.scores) ccc ON true
         JOIN LATERAL private.to_tabular_score(ccc) sc ON true
         JOIN action_referentiel d ON sc.action_id = d.action_id
         LEFT JOIN action_statut s ON c.id = s.collectivite_id AND s.action_id = d.action_id
         LEFT JOIN LATERAL (
    SELECT CASE WHEN NOT d.have_children THEN '{}'::avancement[]
                WHEN ccc.point_non_renseigne = ccc.point_potentiel THEN '{non_renseigne}'::avancement[]
                WHEN ccc.point_non_renseigne > 0.0 THEN '{non_renseigne}'::avancement[] || array_agg(distinct statut.avancement) FILTER (WHERE statut.concerne)
                ELSE array_agg(distinct statut.avancement) FILTER (WHERE statut.concerne) END AS avancements,
           NOT bool_and(statut.concerne) AS non_concerne
    FROM action_statut statut
    WHERE c.id = statut.collectivite_id AND statut.action_id = ANY (d.leaves)
    ) cs ON true
         LEFT JOIN action_relation rel ON rel.id = d.action_id
         LEFT JOIN action_statut p ON c.id = p.collectivite_id AND p.action_id = rel.parent
WHERE est_verifie() OR have_lecture_acces(c.id)
ORDER BY c.id, naturalsort(d.identifiant);

-- =============================================================================
-- 28. labellisation.export_score_audit, public.export_score_audit
-- =============================================================================
CREATE MATERIALIZED VIEW labellisation.export_score_audit AS
WITH score_audit AS (
    WITH last_audit AS (
        WITH last_audit_date AS (
            SELECT collectivite_id, referentiel, max(date_debut) AS date_debut
            FROM labellisation.audit
            WHERE date_debut IS NOT NULL
            GROUP BY collectivite_id, referentiel
        )
        SELECT a.*
        FROM labellisation.audit a
                 JOIN last_audit_date l ON a.collectivite_id = l.collectivite_id AND a.date_debut = l.date_debut AND a.referentiel = l.referentiel
    ),
         table_scores AS (
             SELECT a.id AS audit_id, ccs.*
             FROM last_audit a
                      JOIN client_scores cs ON cs.collectivite_id = a.collectivite_id AND cs.referentiel = a.referentiel
                      JOIN private.convert_client_scores(cs.scores) ccs ON true
             WHERE a.date_fin IS NULL
             UNION
             SELECT a.id AS audit_id, ccs.*
             FROM last_audit a
                      JOIN post_audit_scores pas ON pas.collectivite_id = a.collectivite_id AND pas.referentiel = a.referentiel
                      JOIN private.convert_client_scores(pas.scores) ccs ON true
             WHERE a.date_fin IS NOT NULL
         )
    SELECT a.collectivite_id, a.referentiel, a.date_fin,
           CASE WHEN (s.point_potentiel)::float = 0.0 THEN (s.fait_taches_avancement)::float / (s.total_taches_count)::float
                ELSE (s.point_fait)::float / (s.point_potentiel)::float END AS realise,
           CASE WHEN (s.point_potentiel)::float = 0.0 THEN (s.programme_taches_avancement)::float / (s.total_taches_count)::float
                ELSE (s.point_programme)::float / (s.point_potentiel)::float END AS programme,
           (s.point_potentiel)::float AS points
    FROM last_audit a
             JOIN table_scores s ON s.audit_id = a.id AND s.action_id::text = a.referentiel::text
),
     score_audit_eci AS (SELECT * FROM score_audit WHERE referentiel = 'eci'),
     score_audit_cae AS (SELECT * FROM score_audit WHERE referentiel = 'cae'),
     collectivite_active AS (
         SELECT named_collectivite.collectivite_id
         FROM named_collectivite
                  JOIN private_utilisateur_droit ON named_collectivite.collectivite_id = private_utilisateur_droit.collectivite_id
         WHERE private_utilisateur_droit.active
           AND named_collectivite.collectivite_id NOT IN (SELECT collectivite_id FROM collectivite_test)
         GROUP BY named_collectivite.collectivite_id
     )
SELECT cci.nom AS collectivite,
       cci.region_name AS region,
       cot IS NOT NULL AS cot,
       nc.nom AS signataire,
       sae.realise AS realise_eci,
       sae.programme AS programme_eci,
       sae.points AS points_eci,
       sae.date_fin AS date_cloture_eci,
       sac.realise AS realise_cae,
       sac.programme AS programme_cae,
       sac.points AS points_cae,
       sac.date_fin AS date_cloture_cae
FROM collectivite_carte_identite cci
         JOIN collectivite_active ca ON cci.collectivite_id = ca.collectivite_id
         LEFT JOIN cot ON cci.collectivite_id = cot.collectivite_id
         LEFT JOIN named_collectivite nc ON cot.signataire = nc.collectivite_id
         LEFT JOIN score_audit_eci sae ON cci.collectivite_id = sae.collectivite_id
         LEFT JOIN score_audit_cae sac ON cci.collectivite_id = sac.collectivite_id
ORDER BY cci.nom;

CREATE OR REPLACE VIEW public.export_score_audit AS
SELECT * FROM labellisation.export_score_audit
WHERE is_service_role();

-- =============================================================================
-- 29. stats.report_scores
-- =============================================================================
CREATE MATERIALIZED VIEW stats.report_scores AS
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
         JOIN private.convert_client_scores(cs.scores) ccc ON true
         JOIN private.to_tabular_score(ccc) ts ON true
ORDER BY c.collectivite_id;

-- =============================================================================
-- 30. collectivite_card, collectivite_card(axe), stats.collectivite_referentiel
-- =============================================================================
CREATE MATERIALIZED VIEW collectivite_card AS
WITH      meta_commune AS (SELECT com.collectivite_id, ic.population, ic.code AS insee, ir.code AS region_code, id.code AS departement_code
                     FROM commune com
                              LEFT JOIN imports.commune ic ON ic.code = com.code
                              LEFT JOIN imports.region ir ON ic.region_code = ir.code
                              LEFT JOIN imports.departement id ON ic.departement_code = id.code),
     meta_epci AS (SELECT epci.collectivite_id, ib.population, ib.siren, ir.code AS region_code, id.code AS departement_code
                  FROM epci
                           LEFT JOIN imports.banatic ib ON ib.siren = epci.siren
                           LEFT JOIN imports.region ir ON ib.region_code = ir.code
                           LEFT JOIN imports.departement id ON ib.departement_code = id.code),
     type_collectivite AS (SELECT c.id AS collectivite_id,
                                 CASE WHEN c.id IN (SELECT collectivite_id FROM commune) THEN 'commune'::filterable_type_collectivite
                                      WHEN e.nature IN ('SMF', 'SIVOM', 'SMO', 'SIVU') THEN 'syndicat'::filterable_type_collectivite
                                      WHEN e.nature = 'CA' THEN 'CA'::filterable_type_collectivite
                                      WHEN e.nature = 'CU' THEN 'CU'::filterable_type_collectivite
                                      WHEN e.nature = 'CC' THEN 'CC'::filterable_type_collectivite
                                      WHEN e.nature = 'POLEM' THEN 'POLEM'::filterable_type_collectivite
                                      WHEN e.nature = 'METRO' THEN 'METRO'::filterable_type_collectivite
                                      WHEN e.nature = 'PETR' THEN 'PETR'::filterable_type_collectivite
                                      WHEN e.nature = 'EPT' THEN 'EPT'::filterable_type_collectivite
                                      END AS type
                          FROM collectivite c
                                   LEFT JOIN epci e ON c.id = e.collectivite_id),
     referentiel_score AS (SELECT c.id AS collectivite_id,
                                 max(s.score_fait) FILTER (WHERE referentiel = 'eci') AS score_fait_eci,
                                 max(s.score_fait) FILTER (WHERE referentiel = 'cae') AS score_fait_cae,
                                 min(s.score_fait) AS score_fait_min, max(s.score_fait) AS score_fait_max, sum(s.score_fait) AS score_fait_sum,
                                 max(s.score_programme) FILTER (WHERE referentiel = 'eci') AS score_programme_eci,
                                 max(s.score_programme) FILTER (WHERE referentiel = 'cae') AS score_programme_cae,
                                 max(s.score_programme) AS score_programme_max, sum(s.score_programme) AS score_programme_sum,
                                 max(s.completude) FILTER (WHERE referentiel = 'eci') AS completude_eci,
                                 max(s.completude) FILTER (WHERE referentiel = 'cae') AS completude_cae,
                                 max(s.completude) AS completude_max, min(s.completude) AS completude_min,
                                 bool_and(s.concerne) FILTER (WHERE referentiel = 'eci') AS concerne_eci,
                                 bool_and(s.concerne) FILTER (WHERE referentiel = 'cae') AS concerne_cae
                          FROM collectivite c
                                   JOIN LATERAL (SELECT * FROM private.referentiel_progress(c.id)) s ON true
                          GROUP BY c.id),
     lab_data AS (SELECT collectivite_id,
                         max(l.etoiles) FILTER (WHERE referentiel = 'cae') AS etoiles_cae,
                         max(l.etoiles) FILTER (WHERE referentiel = 'eci') AS etoiles_eci,
                         array_agg(l.etoiles) AS etoiles_all
                  FROM public.labellisation l
                  GROUP BY collectivite_id),
     card AS (SELECT c.collectivite_id, c.nom, tc.type AS type_collectivite,
                     coalesce(mc.insee, me.siren, '') AS code_siren_insee,
                     coalesce(mc.region_code, me.region_code, '') AS region_code,
                     coalesce(mc.departement_code, me.departement_code, '') AS departement_code,
                     coalesce(mc.population, me.population, 0)::int4 AS population,
                     coalesce(l.etoiles_cae, 0) AS etoiles_cae, coalesce(l.etoiles_eci, 0) AS etoiles_eci,
                     coalesce(l.etoiles_all, '{0}') AS etoiles_all,
                     CASE WHEN s.concerne_cae THEN coalesce(s.score_fait_cae, 0) END AS score_fait_cae,
                     CASE WHEN s.concerne_eci THEN coalesce(s.score_fait_eci, 0) END AS score_fait_eci,
                     s.score_fait_min, s.score_fait_max, s.score_fait_sum,
                     CASE WHEN s.concerne_cae THEN coalesce(s.score_programme_cae, 0) END AS score_programme_cae,
                     CASE WHEN s.concerne_eci THEN coalesce(s.score_programme_eci, 0) END AS score_programme_eci,
                     s.score_programme_max, s.score_programme_sum,
                     coalesce(s.completude_cae, 0) AS completude_cae, coalesce(s.completude_eci, 0) AS completude_eci,
                     s.completude_min, s.completude_max
              FROM named_collectivite c
                       LEFT JOIN meta_commune mc ON mc.collectivite_id = c.collectivite_id
                       LEFT JOIN meta_epci me ON me.collectivite_id = c.collectivite_id
                       LEFT JOIN type_collectivite tc ON tc.collectivite_id = c.collectivite_id
                       LEFT JOIN lab_data l ON l.collectivite_id = c.collectivite_id
                       LEFT JOIN referentiel_score s ON s.collectivite_id = c.collectivite_id
              WHERE c.collectivite_id NOT IN (SELECT collectivite_id FROM collectivite_test))
SELECT card.*,
       pop.id AS population_intervalle,
       comp_cae.id AS completude_cae_intervalle,
       comp_eci.id AS completude_eci_intervalle,
       comps.ids AS completude_intervalles,
       fait_cae.id AS fait_cae_intervalle,
       fait_eci.id AS fait_eci_intervalle,
       scores.ids AS fait_intervalles
FROM card
         LEFT JOIN LATERAL (SELECT id FROM filtre_intervalle WHERE type = 'population' AND intervalle @> card.population::numeric LIMIT 1) pop ON true
         LEFT JOIN LATERAL (SELECT id FROM filtre_intervalle WHERE type = 'remplissage' AND intervalle @> (card.completude_cae * 100)::numeric LIMIT 1) comp_cae ON true
         LEFT JOIN LATERAL (SELECT id FROM filtre_intervalle WHERE type = 'remplissage' AND intervalle @> (card.completude_eci * 100)::numeric LIMIT 1) comp_eci ON true
         LEFT JOIN LATERAL (SELECT array_agg(id) AS ids FROM filtre_intervalle WHERE type = 'remplissage' AND intervalle @> (card.completude_min * 100)::numeric) comps ON true
         LEFT JOIN LATERAL (SELECT id FROM filtre_intervalle WHERE type = 'score' AND intervalle @> (card.score_fait_eci * 100)::numeric LIMIT 1) fait_eci ON true
         LEFT JOIN LATERAL (SELECT id FROM filtre_intervalle WHERE type = 'score' AND intervalle @> (card.score_fait_cae * 100)::numeric LIMIT 1) fait_cae ON true
         LEFT JOIN LATERAL (SELECT array_agg(id) AS ids FROM filtre_intervalle WHERE type = 'score' AND intervalle @> (card.score_fait_min * 100)::numeric) scores ON true
WHERE card.collectivite_id IN (SELECT collectivite_id FROM private_utilisateur_droit WHERE active);

CREATE UNIQUE INDEX IF NOT EXISTS collectivite_card_collectivite_id ON collectivite_card (collectivite_id);

CREATE OR REPLACE FUNCTION collectivite_card(axe)
    RETURNS collectivite_card
    STABLE
    LANGUAGE sql
BEGIN
    ATOMIC
    SELECT card.*::collectivite_card FROM collectivite_card card WHERE card.collectivite_id = ($1).collectivite_id;
END;
COMMENT ON FUNCTION collectivite_card(axe) IS 'Le type du plan.';

CREATE MATERIALIZED VIEW stats.collectivite_referentiel AS
SELECT c.*,
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

COMMIT;
