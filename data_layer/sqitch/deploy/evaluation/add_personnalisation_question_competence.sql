-- Deploy tet:evaluation/add_personnalisation_question_competence to pg

BEGIN;

alter table question
  add column competence_code integer references banatic_2025_competence (competence_code);

alter table question
  add column consignes_justification text;

alter table question
  add column expr_visible text;
  comment on column question.expr_visible is 'Formule permettant de déterminer si la question est affichée (toujours si non renseignée)';

COMMIT;
