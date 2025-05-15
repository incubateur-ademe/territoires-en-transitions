-- Deploy tet:indicateur/indicateur_action_expr to pg

BEGIN;

alter table indicateur_action
  add column utilise_par_expr_score_fait boolean default false,
  add column utilise_par_expr_score_programme boolean default false;

comment on column indicateur_action.utilise_par_expr_score_fait is 'Indique que l''indicateur est utilisé dans le calcul du score fait';
comment on column indicateur_action.utilise_par_expr_score_programme is 'Indique que l''indicateur est utilisé dans le calcul du score programmé';

COMMIT;
