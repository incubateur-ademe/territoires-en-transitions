-- Verify tet:evaluation/score_service on pg

BEGIN;

SELECT 1/COUNT(*) FROM evaluation.service_regles;

ROLLBACK;
