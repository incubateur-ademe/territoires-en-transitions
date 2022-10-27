-- Verify tet:referentiel/action_discussion on pg

BEGIN;

select id, collectivite_id, action_id, created_by, created_at, modified_at, status
from action_discussion
where false;

select id, created_by, created_at, discussion_id, message
from action_discussion_commentaire
where false;

select has_function_privilege('supprimer_discussion()', 'execute');
select has_function_privilege('ajouter_commentaire()', 'execute');

ROLLBACK;
