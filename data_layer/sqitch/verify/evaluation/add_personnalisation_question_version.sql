-- Verify tet:evaluation/add_personnalisation_question_version on pg

BEGIN;

select version
from question_choix
where false;

select version
from question
where false;

ROLLBACK;
