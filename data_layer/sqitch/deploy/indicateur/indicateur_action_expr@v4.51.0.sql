-- Deploy tet:indicateur/indicateur_action_expr to pg

BEGIN;

alter table action_definition
  add column expr_score text;
comment on column action_definition.expr_score is 'Formule permettant de calculer une proposition de score à partir d''un indicateur';

alter table indicateur_action
  add column utilise_par_expr_score boolean;
comment on column indicateur_action.utilise_par_expr_score is 'Indique que l''indicateur est utilisé dans une formule de proposition de score';

COMMIT;
