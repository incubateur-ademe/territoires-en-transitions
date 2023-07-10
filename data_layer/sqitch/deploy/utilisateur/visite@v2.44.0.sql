-- Deploy tet:utilisateur/visite to pg

BEGIN;

alter type visite_tag
    add value if not exists 'clef';

alter type visite_tag
    add value if not exists 'tous';

alter type visite_page
    add value if not exists 'indicateurs';

COMMIT;
