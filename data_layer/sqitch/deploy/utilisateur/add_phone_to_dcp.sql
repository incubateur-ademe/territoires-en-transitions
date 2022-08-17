-- Deploy tet:utilisateur/add-phone-to-dcp to pg

BEGIN;

alter table dcp
    add telephone varchar(30);

COMMIT;
