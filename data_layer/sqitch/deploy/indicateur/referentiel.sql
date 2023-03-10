-- Deploy tet:indicateur/referentiel to pg
-- requires: referentiel/contenu

BEGIN;

alter policy allow_read
    on indicateur_resultat
    using (have_lecture_access_with_restreint(collectivite_id));

alter policy allow_read
    on indicateur_objectif
    using (have_lecture_access_with_restreint(collectivite_id));

alter policy allow_read
    on indicateur_commentaire
    using (have_lecture_access_with_restreint(collectivite_id));

COMMIT;
