-- Verify tet:evaluation/regle on pg

BEGIN;

comment on type regle_type is '';

select action_id, titre, description
from personnalisation
where false;

select action_id, type, formule, description
from personnalisation_regle
where false;

select has_function_privilege('business_upsert_personnalisations(json[])', 'execute');
select has_function_privilege('business_replace_personnalisations(json[])', 'execute');

ROLLBACK;
