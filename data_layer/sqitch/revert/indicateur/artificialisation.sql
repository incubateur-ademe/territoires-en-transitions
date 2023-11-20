-- Deploy tet:indicateur/artificialisation to pg

BEGIN;

alter table indicateur_artificialisation
    alter column total type integer using total::integer;

alter table indicateur_artificialisation
    alter column activite type integer using activite::integer;

alter table indicateur_artificialisation
    alter column habitat type integer using habitat::integer;

alter table indicateur_artificialisation
    alter column mixte type integer using mixte::integer;

alter table indicateur_artificialisation
    alter column routiere type integer using routiere::integer;

alter table indicateur_artificialisation
    alter column ferroviaire type integer using ferroviaire::integer;

alter table indicateur_artificialisation
    alter column inconnue type integer using inconnue::integer;

COMMIT;
