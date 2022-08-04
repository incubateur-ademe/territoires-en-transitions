-- Deploy tet:utilisateur/add-phone-to-dcp to pg

BEGIN;

alter table dcp add telephone text not null default '';

COMMIT;
