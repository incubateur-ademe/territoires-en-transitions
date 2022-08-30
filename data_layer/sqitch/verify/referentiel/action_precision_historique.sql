-- Verify tet:referentiel/action_precision_history on pg

BEGIN;

select id,
       collectivite_id,
       action_id,
       precision,
       previous_precision,
       modified_by,
       previous_modified_by,
       modified_at,
       previous_modified_at
from historique.action_precision
where false;

select has_function_privilege('historique.save_action_precision()', 'execute');

comment on trigger save_history on action_commentaire is null;

ROLLBACK;
