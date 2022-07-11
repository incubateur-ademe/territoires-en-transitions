-- Revert tet:utilisateur/add-phone-to-dcp from pg

BEGIN;

alter tabe dcp drop telephone; 

COMMIT;
