-- Revert tet:indicateur/confidentialite from pg

BEGIN;

drop function confidentiel(indicateur_definitions);
drop policy allow_insert on indicateur_confidentiel;
drop policy allow_read on indicateur_confidentiel;
drop policy allow_update on indicateur_confidentiel;
drop policy allow_delete on indicateur_confidentiel;
drop function private.can_write(indicateur_confidentiel);
drop function private.can_read(indicateur_confidentiel);
drop table indicateur_confidentiel;

COMMIT;
