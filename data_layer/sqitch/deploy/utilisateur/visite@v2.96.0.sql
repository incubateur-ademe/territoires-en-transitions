-- Deploy tet:utilisateur/visite to pg

BEGIN;

alter type visite_tag
    add value if not exists 'statuts';

alter type visite_tag
    add value if not exists 'pilotes';

alter type visite_tag
    add value if not exists 'referents';

alter type visite_tag
    add value if not exists 'priorites';

alter type visite_tag
    add value if not exists 'echeances';

COMMIT;
