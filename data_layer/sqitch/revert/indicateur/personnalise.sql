-- Deploy tet:indicateur/personnalise to pg

BEGIN;

alter policy allow_read
    on indicateur_personnalise_definition
    using (is_authenticated());

alter policy allow_read
    on indicateur_personnalise_resultat
    using (is_authenticated());

alter policy allow_read
    on indicateur_personnalise_objectif
    using (is_authenticated());

COMMIT;
