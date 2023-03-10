-- Deploy tet:indicateur/personnalise to pg

BEGIN;

alter policy allow_read
    on indicateur_personnalise_definition
    using (can_read_acces_restreint(collectivite_id));

alter policy allow_read
    on indicateur_personnalise_resultat
    using (can_read_acces_restreint(collectivite_id));

alter policy allow_read
    on indicateur_personnalise_objectif
    using (can_read_acces_restreint(collectivite_id));

COMMIT;
