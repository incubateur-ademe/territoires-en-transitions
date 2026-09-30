-- Deploy tet:indicateur/indicateur_collectivite_is_suivi to pg

BEGIN;

alter table indicateur_collectivite
    add column is_suivi boolean not null default true;

comment on column indicateur_collectivite.is_suivi is
    'Utilisé dans le calcul du score depuis un indicateur pour distinguer les cas "non renseigné" et "pas fait". Distinct de is_applicable.';

COMMIT;
