-- Revert tet:indicateur/indicateur_action_expr from pg

BEGIN;

alter table indicateur_action
  drop column utilise_par_expr_score_fait,
  drop column utilise_par_expr_score_programme;

COMMIT;
