-- Deploy tet:indicateur/indicateur_action_expr to pg

BEGIN;

alter table indicateur_action
  drop column utilise_par_expr_score;

COMMIT;
