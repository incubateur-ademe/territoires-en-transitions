-- Annule uniquement l'expérience TET-6452 créée par import-local-audit-cae-2023.sql.
-- Simulation (ROLLBACK par défaut) :
-- docker exec -i tet-db-1 psql -X -U postgres -d postgres < data_layer/scripts/rollback-local-audit-cae-2023.sql
-- Suppression locale : ajouter -v apply=true à la commande psql.
-- La garde socket Unix exige une exécution dans le conteneur LOCAL tet-db-1.
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

LOCK TABLE public.score_snapshot IN SHARE ROW EXCLUSIVE MODE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.score_snapshot
    WHERE collectivite_id = 4600 AND referentiel_id = 'cae'
      AND ref = 'local-audit-cae-2023-05-02'
      AND (
        referentiel_scores #>> '{localImportExperiment,id}' IS DISTINCT FROM 'tet-6452-local-audit-cae-2023-v1'
        OR nom IS DISTINCT FROM '[LOCAL] Audit externe 2023 — données partielles'
        OR date IS DISTINCT FROM TIMESTAMPTZ '2023-05-02 00:00:00+00'
        OR type_jalon IS DISTINCT FROM 'date_personnalisee'
        OR audit_id IS NOT NULL
        OR referentiel_version IS DISTINCT FROM 'external-unknown'
      )
  ) THEN
    RAISE EXCEPTION 'La référence existe mais ne correspond pas à cette expérience locale : suppression refusée';
  END IF;
END
$$;

DELETE FROM public.score_snapshot
WHERE collectivite_id = 4600 AND referentiel_id = 'cae'
  AND ref = 'local-audit-cae-2023-05-02'
  AND referentiel_scores #>> '{localImportExperiment,id}' = 'tet-6452-local-audit-cae-2023-v1'
RETURNING ref, nom, date::date;

\if :apply
  COMMIT;
  \echo 'Snapshot expérimental supprimé de la base locale (ou déjà absent).'
\else
  ROLLBACK;
  \echo 'Simulation terminée : aucune suppression conservée. Ajouter -v apply=true pour supprimer localement.'
\endif
