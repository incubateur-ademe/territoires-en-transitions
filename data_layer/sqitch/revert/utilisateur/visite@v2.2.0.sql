-- Revert tet:utilisateur/visite from pg

BEGIN;

drop table visite;

drop type visite_page;
drop type visite_tag;
drop type visite_onglet;

COMMIT;
