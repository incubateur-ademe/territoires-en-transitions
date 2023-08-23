-- Deploy tet:indicateur/referentiel to pg
-- requires: referentiel/contenu

BEGIN;

alter table indicateur_perso_resultat_commentaire
    enable row level security;
alter table indicateur_perso_objectif_commentaire
    enable row level security;
alter table indicateur_objectif_commentaire
    enable row level security;


COMMIT;
