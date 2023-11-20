-- Revert tet:indicateur/artificialisation from pg

BEGIN;

drop function indicateur_artificialisation(site_labellisation);
drop table indicateur_artificialisation;

COMMIT;
