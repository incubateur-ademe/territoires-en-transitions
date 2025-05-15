-- Revert tet:indicateur/indicateur_action_expr from pg

BEGIN;

alter table indicateur_action
  drop column utilise_par_expr_score;

alter table action_definition
  drop column expr_score;

COMMIT;
