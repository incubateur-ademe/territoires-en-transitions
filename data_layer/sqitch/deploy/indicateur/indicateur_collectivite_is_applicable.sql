-- Deploy tet:indicateur/indicateur_collectivite_is_applicable to pg

BEGIN;

alter table indicateur_collectivite
    add column is_applicable boolean not null default true;

comment on column indicateur_collectivite.is_applicable is
    'Choix explicite de la collectivité : un indicateur non applicable ne lui est plus réclamé. Distinct de l''absence de saisie, qui reste l''absence de ligne dans indicateur_valeur.';

COMMIT;
