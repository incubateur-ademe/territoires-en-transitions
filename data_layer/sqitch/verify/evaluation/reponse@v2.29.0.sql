-- Verify tet:evaluation/reponse on pg

BEGIN;

select modified_at, collectivite_id, question_id, reponse
from reponse_choix
where false;

select modified_at, collectivite_id, question_id, reponse
from reponse_binaire
where false;

select modified_at, collectivite_id, question_id, reponse
from reponse_proportion
where false;

select collectivite_id, reponses
from business_reponse
where false;

select question_id, collectivite_id, reponse
from reponse_display
where false;

select has_function_privilege('save_reponse(json)', 'execute');

ROLLBACK;
