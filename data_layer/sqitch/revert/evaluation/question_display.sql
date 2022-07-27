-- Revert tet:evaluation/question_display from pg

BEGIN;

drop view question_display;

COMMIT;
