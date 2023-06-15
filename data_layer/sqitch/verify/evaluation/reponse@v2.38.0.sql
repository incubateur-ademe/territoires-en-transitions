-- Verify tet:evaluation/reponse on pg

BEGIN;

select question_id, collectivite_id, reponse, justification
from reponse_display
where false;

ROLLBACK;
