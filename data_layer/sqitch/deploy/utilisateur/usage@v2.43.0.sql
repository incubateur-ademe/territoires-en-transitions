-- Deploy tet:utilisateur/usage to pg

BEGIN;

alter type usage_fonction add value if not exists 'cta_plan';
alter type usage_fonction add value if not exists 'cta_indicateur';
alter type usage_fonction add value if not exists 'cta_labellisation';

COMMIT;
