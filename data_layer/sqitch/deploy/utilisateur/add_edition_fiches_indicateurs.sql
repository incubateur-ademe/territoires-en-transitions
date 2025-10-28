-- Deploy tet:utilisateur/add_edition_fiches_indicateurs to pg

BEGIN;

-- TODO: change the niveau_acces type to varchar(50), but requires deleting a lot of views  but also all policies depending on have_edition_acces
ALTER TYPE niveau_acces ADD VALUE IF NOT EXISTS 'edition_fiches_indicateurs';

COMMIT;
