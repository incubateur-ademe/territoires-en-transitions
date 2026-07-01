-- Deploy tet:referentiel/add_thematique_sgpe to pg

BEGIN;

alter table action_definition
  add column thematique_sgpe text;
comment on column action_definition.thematique_sgpe is
  'Thématique SGPE (clé technique, ex. planifier, se_deplacer)';

COMMIT;
