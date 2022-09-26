-- Verify tet:referentiel/action_statut_history on pg

BEGIN;

select collectivite_id,
       action_id,
       avancement,
       previous_avancement,
       avancement_detaille,
       previous_avancement_detaille,
       concerne,
       previous_concerne,
       modified_by,
       previous_modified_by,
       modified_at,
       previous_modified_at
from historique.action_statut
where false;

comment on trigger save_history on action_statut is null;

select has_function_privilege('historique.save_action_statut()', 'execute');


ROLLBACK;
