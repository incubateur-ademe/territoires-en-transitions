-- Deploy tet:indicateur/fusion to pg

BEGIN;

-- Recrée le type indicateur_generique
create type indicateur_generique as
(
    indicateur_id indicateur_id,
    indicateur_personnalise_id integer,
    nom text,
    description text,
    unite text
);

COMMIT;
