-- Revert tet:evaluation/add_personnalisation_question_competence from pg

BEGIN;

alter table question
  drop column competence_code;

alter table question
  drop column consignes_justification;

alter table question
  drop column expr_visible;

COMMIT;
