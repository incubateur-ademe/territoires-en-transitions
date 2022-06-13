-- Verify tet:dcp on pg

BEGIN;

select user_id,
       nom,
       prenom,
       email,
       limited,
       deleted,
       created_at,
       modified_at
from dcp;

ROLLBACK;
