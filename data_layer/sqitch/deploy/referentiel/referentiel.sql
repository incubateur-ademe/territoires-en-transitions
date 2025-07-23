-- Deploy tet:referentiel/referentiel to pg

BEGIN;

alter table referentiel_definition
  add column locked boolean default false;
comment on column referentiel_definition.locked is 'Permet de verrouiller l''import depuis le spreadsheet de certaines colonnes "sensibles"';

COMMIT;
