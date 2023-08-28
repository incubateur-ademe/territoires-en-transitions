-- Deploy tet:utilisateur/usage to pg

BEGIN;

alter type usage_fonction add value if not exists 'navigation_laterale';
alter type usage_fonction add value if not exists 'panneau_lateral';
alter type usage_action add value if not exists 'ouverture';
alter type usage_action add value if not exists 'fermeture';

COMMIT;
