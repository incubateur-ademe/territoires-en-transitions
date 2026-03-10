-- Deploy tet:evaluation/question_choix_formulation_not_null to pg

BEGIN;

ALTER TABLE question_choix
    ALTER COLUMN formulation SET NOT NULL;

COMMIT;
