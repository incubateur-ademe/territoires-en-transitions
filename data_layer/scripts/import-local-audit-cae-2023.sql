-- TET-6452: expérience locale sur une base restaurée avec
-- make db-restore-local-from-prod-backup. Aucun appel au calcul de score.
-- Simulation (ROLLBACK par défaut) :
-- docker exec -i tet-db-1 psql -X -U postgres -d postgres < data_layer/scripts/import-local-audit-cae-2023.sql
-- Import local : ajouter -v apply=true à la commande psql.
-- Annulation : utiliser rollback-local-audit-cae-2023.sql.
--
-- Source : rapport COT de Val de Garonne établi le 02/05/2023, pages 2 et 4.
-- Le total 437,5 de ces tableaux est cohérent avec les six axes et 31,45 %.
-- Le potentiel 450,7 en page 1 est contradictoire : choix à confirmer avant
-- tout import réel. Les points programmés du dossier déposé ne sont pas audités.
--
-- Ceci n'est PAS un format d'import pris en charge par l'application.
-- Les valeurs inconnues restent null dans le JSON : cette structure partielle
-- ne satisfait pas ActionScoreFinal. Aucun statut ou détail sous les axes n'est
-- inventé. Seules les colonnes NOT NULL point_programme/point_pas_fait imposent
-- des zéros techniques, explicitement documentés dans localImportExperiment.
-- La version historique inconnue utilise le marqueur external-unknown car la
-- base restaurée impose également NOT NULL à referentiel_version.
-- Les écrans peuvent interpréter ces zéros ou null comme des valeurs réelles.
-- La garde socket Unix évite une connexion TCP distante accidentelle ; elle
-- ne dispense pas de lancer la commande dans le conteneur LOCAL tet-db-1.
\set ON_ERROR_STOP on
\if :{?apply}
\else
  \set apply false
\endif

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
SET LOCAL row_security = off;

DO $$
BEGIN
  IF inet_client_addr() IS NOT NULL OR inet_server_addr() IS NOT NULL THEN
    RAISE EXCEPTION 'Expérience locale uniquement : utiliser docker exec et le socket Unix de tet-db-1';
  END IF;
END
$$;

-- Empêche une modification concurrente des snapshots pendant les assertions.
LOCK TABLE public.score_snapshot IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE previous_snapshots ON COMMIT DROP AS
SELECT referentiel_id, ref, md5(to_jsonb(snapshot)::text) AS fingerprint
FROM public.score_snapshot snapshot
WHERE collectivite_id = 4600
  AND NOT (referentiel_id = 'cae' AND ref = 'local-audit-cae-2023-05-02');

CREATE TEMP TABLE audit_axes (
  identifiant integer PRIMARY KEY,
  nom text NOT NULL,
  point_referentiel numeric NOT NULL CHECK (point_referentiel > 0),
  point_potentiel numeric NOT NULL CHECK (point_potentiel > 0),
  point_fait numeric NOT NULL CHECK (point_fait >= 0 AND point_fait <= point_potentiel)
) ON COMMIT DROP;

INSERT INTO audit_axes VALUES
  (1, 'Planification territoriale', 100, 91.5, 32.08),
  (2, 'Patrimoine de la collectivité', 64, 60, 7.78),
  (3, 'Approvisionnement énergie, eau, assainissement', 94, 63, 18.82),
  (4, 'Mobilité', 96, 80, 20.08),
  (5, 'Organisation interne', 46, 46, 19.02),
  (6, 'Coopération, communication', 100, 97, 39.8);

DO $$
BEGIN
  IF (SELECT count(*) <> 6 OR sum(point_referentiel) <> 500
      OR sum(point_potentiel) <> 437.5 OR sum(point_fait) <> 137.58
      FROM audit_axes) THEN
    RAISE EXCEPTION 'Les six axes doivent correspondre aux totaux du rapport';
  END IF;
END
$$;

CREATE FUNCTION pg_temp.build_partial_score(
  action_id text, point_referentiel numeric,
  point_potentiel numeric, point_fait numeric
) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
  SELECT jsonb_build_object(
    'actionId', action_id,
    'pointReferentiel', point_referentiel,
    'pointPotentiel', point_potentiel,
    'pointFait', point_fait,
    'pointPotentielPerso', NULL,
    'pointProgramme', NULL,
    'pointPasFait', NULL,
    'pointNonRenseigne', NULL,
    'totalTachesCount', NULL,
    'completedTachesCount', NULL,
    'faitTachesAvancement', NULL,
    'programmeTachesAvancement', NULL,
    'pasFaitTachesAvancement', NULL,
    'pasConcerneTachesAvancement', NULL,
    'concerne', NULL,
    'desactive', NULL,
    'renseigne', NULL
  );
$$;

CREATE TEMP TABLE expected_snapshot ON COMMIT DROP AS
WITH axe_nodes AS (
  SELECT jsonb_agg(jsonb_build_object(
    'actionId', 'cae_' || identifiant,
    'identifiant', identifiant::text,
    'nom', nom,
    'actionType', 'axe',
    'level', 1,
    'points', point_referentiel,
    'categorie', NULL,
    'scoresTag', '{}'::jsonb,
    'score', pg_temp.build_partial_score('cae_' || identifiant, point_referentiel, point_potentiel, point_fait),
    'actionsEnfant', '[]'::jsonb
  ) ORDER BY identifiant) AS nodes
  FROM audit_axes
), identity_source AS (
  SELECT referentiel_scores -> 'collectiviteInfo' AS collectivite_info, ref
  FROM public.score_snapshot
  WHERE collectivite_id = 4600 AND referentiel_id = 'cae'
    AND ref <> 'local-audit-cae-2023-05-02'
  ORDER BY date DESC, ref
  LIMIT 1
)
SELECT 4600 AS collectivite_id, 'cae'::varchar AS referentiel_id,
  'external-unknown'::varchar(16) AS referentiel_version, NULL::integer AS audit_id,
  TIMESTAMPTZ '2023-05-02 00:00:00+00' AS date,
  'date_personnalisee'::varchar AS type_jalon,
  'local-audit-cae-2023-05-02'::varchar AS ref,
  '[LOCAL] Audit externe 2023 — données partielles'::varchar AS nom,
  137.58::double precision AS point_fait,
  0::double precision AS point_programme,
  0::double precision AS point_pas_fait,
  437.5::double precision AS point_potentiel,
  NULL::integer AS etoiles,
  '{}'::jsonb AS personnalisation_reponses,
  jsonb_build_object(
    'collectiviteId', 4600,
    'referentielId', 'cae',
    'referentielVersion', 'external-unknown',
    'collectiviteInfo', identity_source.collectivite_info,
    'date', '2023-05-02T00:00:00.000Z',
    'jalon', 'date_personnalisee',
    'payloadVersion', 2,
    'scores', jsonb_build_object(
      'actionId', 'cae',
      'identifiant', '',
      'nom', 'Climat Air Énergie',
      'actionType', 'referentiel',
      'level', 0,
      'points', 500,
      'categorie', NULL,
      'scoresTag', '{}'::jsonb,
      'score', pg_temp.build_partial_score('cae', 500, 437.5, 137.58),
      'actionsEnfant', axe_nodes.nodes
    ),
    'localImportExperiment', jsonb_build_object(
      'id', 'tet-6452-local-audit-cae-2023-v1',
      'localOnly', true,
      'partial', true,
      'sourceIssue', 'https://app.notion.com/p/2d86523d57d781429fa8cd624d2e080a',
      'sourceReport', 'Rapport d’audit COT - CA Val de Garonne, établi le 02/05/2023',
      'sourcePdfSha256', 'beb55b911a6d94b87d6410f39ccf11e8bf729c5a37a7c3b55d831b7aad191128',
      'sourcePages', jsonb_build_array(2, 4),
      'sourceScope', 'total et six axes, après audit COT',
      'potentialChoice', '437.5 : somme des axes des tableaux, contredit 450.7 en page 1 ; à confirmer',
      'unknown', jsonb_build_array('referentielVersion', 'auditId', 'personnalisation', 'statuts', 'taches', 'pointProgramme', 'pointPasFait', 'pointNonRenseigne', 'etoiles'),
      'aggregatePlaceholders', jsonb_build_object('point_programme', 0, 'point_pas_fait', 0),
      'aggregatePlaceholderReason', 'Colonnes NOT NULL ; ces zéros ne sont pas des résultats audités',
      'versionPlaceholderReason', 'Colonne referentiel_version NOT NULL ; external-unknown est un marqueur technique, pas une version du référentiel',
      'identitySourceSnapshotRef', identity_source.ref,
      'identitySourceScope', 'Identité actuelle uniquement, ne représente pas la personnalisation ni la population en 2023',
      'personnalisationScope', 'Objet vide car inconnue ; aucune réponse actuelle recopiée',
      'scoresTagScope', 'Objet vide car ventilation par tags inconnue',
      'childrenScope', 'Tableaux vides sous les axes : détails non importés, pas des actions sans enfant',
      'schemaLimitation', 'Les champs inconnus null ne satisfont pas ActionScoreFinal'
    )
  ) AS referentiel_scores
FROM axe_nodes CROSS JOIN identity_source;

DO $$
DECLARE
  existing_snapshot public.score_snapshot%ROWTYPE;
BEGIN
  IF (SELECT count(*) FROM expected_snapshot) <> 1
    OR (SELECT jsonb_typeof(referentiel_scores -> 'collectiviteInfo') FROM expected_snapshot) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Un snapshot CAE existant avec collectiviteInfo est requis pour la collectivité 4600';
  END IF;

  -- Charger la seule ligne cible par sa clé avant de désérialiser le JSON.
  SELECT * INTO existing_snapshot
  FROM public.score_snapshot
  WHERE collectivite_id = 4600 AND referentiel_id = 'cae'
    AND ref = 'local-audit-cae-2023-05-02';

  IF FOUND AND to_jsonb(existing_snapshot) - ARRAY['created_at', 'modified_at', 'created_by', 'modified_by']
    IS DISTINCT FROM (SELECT to_jsonb(expected) FROM expected_snapshot expected) THEN
    RAISE EXCEPTION 'La référence existe avec un contenu différent : aucun remplacement automatique';
  END IF;
END
$$;

INSERT INTO public.score_snapshot (
  collectivite_id, referentiel_id, referentiel_version, audit_id, date,
  type_jalon, ref, nom, point_fait, point_programme, point_pas_fait,
  point_potentiel, etoiles, personnalisation_reponses, referentiel_scores
)
SELECT * FROM expected_snapshot
ON CONFLICT (collectivite_id, referentiel_id, ref) DO NOTHING;

DO $$
DECLARE
  imported_snapshot public.score_snapshot%ROWTYPE;
BEGIN
  SELECT * INTO imported_snapshot
  FROM public.score_snapshot
  WHERE collectivite_id = 4600 AND referentiel_id = 'cae'
    AND ref = 'local-audit-cae-2023-05-02';

  IF NOT FOUND OR to_jsonb(imported_snapshot) - ARRAY['created_at', 'modified_at', 'created_by', 'modified_by']
    IS DISTINCT FROM (SELECT to_jsonb(expected) FROM expected_snapshot expected) THEN
    RAISE EXCEPTION 'Le snapshot importé ne correspond pas aux données préparées';
  END IF;

  IF EXISTS (
    SELECT 1 FROM previous_snapshots previous
    FULL JOIN (
      SELECT referentiel_id, ref, md5(to_jsonb(snapshot)::text) AS fingerprint
      FROM public.score_snapshot snapshot
      WHERE collectivite_id = 4600
        AND NOT (referentiel_id = 'cae' AND ref = 'local-audit-cae-2023-05-02')
    ) current_snapshots USING (referentiel_id, ref)
    WHERE previous.fingerprint IS DISTINCT FROM current_snapshots.fingerprint
  ) THEN
    RAISE EXCEPTION 'Un autre snapshot a été modifié';
  END IF;
END
$$;

SELECT ref, date::date, nom, point_fait, point_potentiel,
  round((100 * point_fait / point_potentiel)::numeric, 4) AS pourcentage_fait,
  jsonb_array_length(referentiel_scores #> '{scores,actionsEnfant}') AS nombre_axes,
  (SELECT count(*) FROM previous_snapshots) AS autres_snapshots_preserves
FROM public.score_snapshot
WHERE collectivite_id = 4600 AND referentiel_id = 'cae'
  AND ref = 'local-audit-cae-2023-05-02';

\if :apply
  COMMIT;
  \echo 'Snapshot expérimental conservé dans la base locale.'
\else
  ROLLBACK;
  \echo 'Simulation terminée : aucune modification conservée. Ajouter -v apply=true pour importer localement.'
\endif
