-- Revert tet:utilisateur/referent_contacts from pg

BEGIN;

drop function referent_contacts(id integer);

COMMIT;
