-- Revert tet:evaluation/question_choix_formulation_not_null from pg

BEGIN;

ALTER TABLE question_choix
    ALTER COLUMN formulation DROP NOT NULL;

COMMIT;
