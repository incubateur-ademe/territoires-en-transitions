-- Deploy tet:indicateur/artificialisation to pg

BEGIN;

alter table indicateur_artificialisation
    alter column total type double precision using total::double precision;

alter table indicateur_artificialisation
    alter column activite type double precision using activite::double precision;

alter table indicateur_artificialisation
    alter column habitat type double precision using habitat::double precision;

alter table indicateur_artificialisation
    alter column mixte type double precision using mixte::double precision;

alter table indicateur_artificialisation
    alter column routiere type double precision using routiere::double precision;

alter table indicateur_artificialisation
    alter column ferroviaire type double precision using ferroviaire::double precision;

alter table indicateur_artificialisation
    alter column inconnue type double precision using inconnue::double precision;

COMMIT;
