-- Deploy tet:referentiel/add_adaptation_niveau to pg

BEGIN;

alter table action_definition
  add column adaptation_niveau text check (adaptation_niveau IN ('exposition_faible', 'exposition_partielle', 'exposition_forte'));
comment on column action_definition.adaptation_niveau is 'Niveau d''exposition au changement climatique';

COMMIT;
