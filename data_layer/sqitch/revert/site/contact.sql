-- Revert tet:site/contact from pg

BEGIN;

drop table site_contact;

COMMIT;
