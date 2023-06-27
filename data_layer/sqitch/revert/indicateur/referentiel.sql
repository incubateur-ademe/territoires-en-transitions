-- Deploy tet:indicateur/referentiel to pg
-- requires: referentiel/contenu

BEGIN;

drop view indicateur_rempli;

alter table indicateur_definition
    rename column groupe to indicateur_group;

alter table indicateur_definition
    add obligation_eci bool not null default false;

alter table indicateur_definition
    drop participation_score;

alter table indicateur_definition
    drop titre_long;

alter table indicateur_definition
    drop parent;

alter table indicateur_definition
    add parent integer
        references indicateur_parent;

alter table indicateur_definition
    drop source;

alter table indicateur_definition
    drop type;

alter table indicateur_definition
    drop thematiques;

alter table indicateur_definition
    drop programmes;

drop type indicateur_programme;
drop type indicateur_thematique;
drop type indicateur_referentiel_type;


alter table indicateur_resultat_commentaire
    rename to indicateur_commentaire;

alter table indicateur_commentaire
    drop constraint unique_collectivite_indicateur_annee;

alter table indicateur_commentaire
    drop annee;

alter table indicateur_commentaire
    add constraint indicateur_commentaire_pkey unique (collectivite_id, indicateur_id);

COMMIT;
