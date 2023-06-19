-- Deploy tet:indicateur/referentiel to pg
-- requires: referentiel/contenu

BEGIN;

alter policy allow_read
    on indicateur_resultat
    using (is_authenticated());

alter policy allow_read
    on indicateur_objectif
    using (is_authenticated());

alter policy allow_read
    on indicateur_commentaire
    using (is_authenticated());

COMMIT;
