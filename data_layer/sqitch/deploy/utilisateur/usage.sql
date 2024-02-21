-- Deploy tet:utilisateur/usage to pg

BEGIN;

alter type usage_fonction add value if not exists 'filtre_type_de_plan';

COMMIT;
