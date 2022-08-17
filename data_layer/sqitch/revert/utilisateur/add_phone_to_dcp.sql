-- Revert tet:utilisateur/add-phone-to-dcp from pg

BEGIN;

alter table dcp drop telephone; 

COMMIT;
