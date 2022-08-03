-- Verify tet:utilisateur/dcp_display on pg

BEGIN;

select user_id,
       nom,
       prenom,
       email,
       limited,
       deleted,
       created_at,
       modified_at,
       telephone
from utilisateur.dcp_display
where false;

ROLLBACK;
