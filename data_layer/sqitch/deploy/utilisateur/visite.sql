-- Deploy tet:utilisateur/visite to pg

BEGIN;

alter type visite_page
    add value if not exists 'synthese_plans';

alter type visite_onglet
    add value if not exists 'informations';

alter type visite_onglet
    add value if not exists 'commentaires';

COMMIT;
