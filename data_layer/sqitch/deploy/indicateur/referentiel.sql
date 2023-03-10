-- Deploy tet:indicateur/referentiel to pg
-- requires: referentiel/contenu

BEGIN;

alter policy allow_read
    on indicateur_resultat
    using (can_read_acces_restreint(collectivite_id));

alter policy allow_read
    on indicateur_objectif
    using (can_read_acces_restreint(collectivite_id));

alter policy allow_read
    on indicateur_commentaire
    using (can_read_acces_restreint(collectivite_id));

COMMIT;
