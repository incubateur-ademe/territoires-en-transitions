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
       cgu_acceptees_le
from dcp where false;

select has_function_privilege('accepter_cgu()', 'execute');

ROLLBACK;
