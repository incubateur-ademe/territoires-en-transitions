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
from history.action_statut
where false;

comment on trigger save_history on action_statut is null;

select has_function_privilege('history.save_action_statut()', 'execute');

select tache_id,
       action_id,
       tache_identifiant,
       tache_nom,
       action_identifiant,
       action_nom,
       collectivite_id,
       avancement,
       previous_avancement,
       avancement_detaille,
       previous_avancement_detaille,
       concerne,
       previous_concerne,
       modified_by,
       modified_at,
       nom
from historical_action_statut
where false;

ROLLBACK;
