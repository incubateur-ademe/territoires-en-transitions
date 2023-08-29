-- Verify tet:dcp on pg

BEGIN;

select user_id, verifie
from utilisateur_verifie where false;

select user_id, support
from utilisateur_support where false;

select has_function_privilege('est_verifie()', 'execute');
select has_function_privilege('est_support()', 'execute');
select has_function_privilege('after_insert_dcp_add_rights()', 'execute');

ROLLBACK;
