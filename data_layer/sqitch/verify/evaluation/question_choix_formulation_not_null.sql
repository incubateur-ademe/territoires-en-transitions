-- Verify tet:evaluation/question_choix_formulation_not_null on pg

BEGIN;

SELECT formulation
FROM question_choix
WHERE false;

ROLLBACK;
