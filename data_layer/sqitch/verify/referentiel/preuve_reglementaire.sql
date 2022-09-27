-- Verify tet:referentiel/preuve_reglementaire on pg

BEGIN;

comment on trigger after_preuve_json on preuve_reglementaire_json is '';
select has_function_privilege('labellisation.upsert_preuves_reglementaire(jsonb)', 'execute');
select has_function_privilege('labellisation.upsert_preuves_reglementaire_after_json_insert()', 'execute');
select preuve_id, action_id
from preuve_action
where false;
select id, nom, description
from preuve_reglementaire_definition
where false;
select preuves, created_at
from preuve_reglementaire_json
where false;

ROLLBACK;
