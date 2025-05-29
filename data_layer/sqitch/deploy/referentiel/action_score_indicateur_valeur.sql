-- Deploy tet:referentiel/action_score_indicateur_valeur to pg

BEGIN;

create table action_score_indicateur_valeur
(
  action_id action_id references public.action_definition on delete cascade not null,
  collectivite_id integer references public.collectivite on delete cascade not null,
  indicateur_id integer references public.indicateur_definition on delete cascade not null,
  indicateur_valeur_id integer references public.indicateur_valeur on delete cascade not null,
  type_score text check (type_score in ('fait', 'programme')) not null,

  primary key (action_id, collectivite_id, indicateur_valeur_id, type_score)
);
comment on column action_score_indicateur_valeur.type_score is 'Valeur d''indicateur utilisée pour le calcul du score "fait" ou "programmé"';
comment on table action_score_indicateur_valeur is 'Valeur d''indicateur utilisée pour le calcul d''une proposition de score';

COMMIT;
