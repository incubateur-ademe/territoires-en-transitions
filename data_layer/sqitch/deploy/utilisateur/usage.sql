-- Deploy tet:utilisateur/usage to pg

BEGIN;

alter type usage_fonction add value if not exists 'annulation';
alter type usage_fonction add value if not exists 'modele_import';

COMMIT;
