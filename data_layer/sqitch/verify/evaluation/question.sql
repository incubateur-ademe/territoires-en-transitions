-- Verify tet:evaluation/question on pg

BEGIN;

comment on type question_type is '';
comment on domain question_id is '';
comment on domain choix_id is '';

select id, nom
from question_thematique
where false;

select id, thematique_id, ordonnancement, types_collectivites_concernees, type, description, formulation
from question
where false;

select question_id, id, ordonnancement, formulation
from question_choix
where false;

select question_id, action_id
from question_action
where false;

select id, nom, referentiels
from question_thematique_display
where false;

select has_function_privilege('business_upsert_questions(json[])', 'execute');

select id, type, choix_ids
from question_engine
where false;

ROLLBACK;
