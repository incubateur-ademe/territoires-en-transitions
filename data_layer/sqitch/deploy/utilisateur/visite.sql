-- Deploy tet:utilisateur/visite to pg

BEGIN;

alter type visite_onglet
    add value if not exists 'collectivites';
alter type visite_onglet
    add value if not exists 'plans';

COMMIT;
