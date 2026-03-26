-- Verify tet:evaluation/add_personnalisation_question_competence on pg

BEGIN;

select competence_code, consignes_justification, expr_visible
from question
where false;

ROLLBACK;
