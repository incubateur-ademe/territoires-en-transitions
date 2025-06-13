-- Deploy tet:indicateur/indicateur_action_expr to pg

BEGIN;

alter table indicateur_action
  add column utilise_par_expr_score boolean;
comment on column indicateur_action.utilise_par_expr_score is 'Indique que l''indicateur est utilisé dans une formule de proposition de score';

COMMIT;
