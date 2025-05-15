-- Deploy tet:indicateur/indicateur_action_expr to pg

BEGIN;

alter table action_definition
  add column expr_score text;
comment on column action_definition.expr_score is 'Formule permettant de calculer une proposition de score à partir d''un indicateur';

alter table indicateur_action
  add column utilise_par_expr_score boolean;
comment on column indicateur_action.utilise_par_expr_score is 'Indique que l''indicateur est utilisé dans une formule de proposition de score';

create table action_score_indicateur_valeur
(
  action_id action_id references public.action_definition on delete cascade not null,
  indicateur_valeur_id integer references public.indicateur_valeur on delete cascade not null,
  type_score text check (type_score in ('fait', 'programme')),

  primary key (action_id, indicateur_valeur_id, type_score)
);
comment on table action_score_indicateur_valeur is 'Valeur d''indicateur utilisée pour le calcul d''une proposition de score';

COMMIT;
