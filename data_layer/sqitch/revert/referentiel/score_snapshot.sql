-- Revert tet:referentiel/score_snapshot from pg

BEGIN;

DROP TRIGGER IF EXISTS after_save_snapshot ON client_scores;
DROP TRIGGER IF EXISTS after_save_snapshot ON post_audit_scores;
DROP TRIGGER IF EXISTS after_save_snapshot ON pre_audit_scores;

DROP FUNCTION IF EXISTS automatisation.save_score_snapshot;
DROP FUNCTION IF EXISTS after_client_scores_save_snapshot;
DROP FUNCTION IF EXISTS after_post_audit_scores_save_snapshot;
DROP FUNCTION IF EXISTS automatisation.after_pre_audit_scores_save_snapshot;

DROP TABLE IF EXISTS score_snapshot;

COMMIT;
