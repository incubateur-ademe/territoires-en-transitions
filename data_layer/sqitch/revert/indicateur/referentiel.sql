-- Deploy tet:indicateur/referentiel to pg
-- requires: referentiel/contenu

BEGIN;

alter table indicateur_definition
    rename column groupe to indicateur_group;

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

drop type indicateur_referentiel_type;

COMMIT;
