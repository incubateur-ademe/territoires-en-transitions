-- Verify tet:dcp on pg

BEGIN;

select user_id,
       nom,
       prenom,
       email,
       telephone,
       limited,
       deleted,
       created_at,
       modified_at,
       cgu_acceptees_le,
       verifie,
       support
from dcp where false;

select has_function_privilege('est_verifie()', 'execute');
select has_function_privilege('est_support()', 'execute');
select has_function_privilege('before_insert_check_support()', 'execute');

ROLLBACK;
