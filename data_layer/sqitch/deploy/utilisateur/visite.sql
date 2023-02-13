-- Deploy tet:utilisateur/visite to pg

BEGIN;

alter type visite_page
    add value if not exists 'plan_axe';
alter type visite_page
    add value if not exists 'fiches_non_classees';

COMMIT;
