-- Verify tet:utilisateur/add-phone-to-dcp on pg

BEGIN;

select telephone
from dcp
where false;


ROLLBACK;
