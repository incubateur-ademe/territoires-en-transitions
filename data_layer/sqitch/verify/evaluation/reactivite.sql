-- Verify tet:evaluation/reactivite on pg

BEGIN;

select id, collectivite_id, created_at
from reponse_update_event
where false;

select has_function_privilege('after_reponse_insert_write_event()', 'execute');

select collectivite_id, created_at
from unprocessed_reponse_update_event
where false;

comment on trigger after_reponse_proportion_write on reponse_proportion is '';
comment on trigger after_reponse_binaire_write on reponse_binaire is '';
comment on trigger after_reponse_choix_write on reponse_choix is '';

ROLLBACK;
