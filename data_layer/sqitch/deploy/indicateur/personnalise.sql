-- Deploy tet:indicateur/personnalise to pg

BEGIN;

alter policy allow_read
    on indicateur_personnalise_definition
    using (have_lecture_access_with_restreint(collectivite_id));

alter policy allow_read
    on indicateur_personnalise_resultat
    using (have_lecture_access_with_restreint(collectivite_id));

alter policy allow_read
    on indicateur_personnalise_objectif
    using (have_lecture_access_with_restreint(collectivite_id));

COMMIT;
