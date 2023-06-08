-- Deploy tet:utilisateur/visite to pg

BEGIN;

alter type visite_page
    add value if not exists 'nouveau_plan';

alter type visite_page
    add value if not exists 'nouveau_plan_import';

alter type visite_page
    add value if not exists 'nouveau_plan_creation';

COMMIT;
