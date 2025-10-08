-- Revert tet:evaluation/add_personnalisation_question_version from pg

BEGIN;

alter table question_choix
    drop column version;

alter table question
    drop column version;

COMMIT;
