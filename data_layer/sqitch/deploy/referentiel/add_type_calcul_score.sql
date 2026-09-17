-- Deploy tet:referentiel/add_type_calcul_score to pg

BEGIN;

alter table action_definition
  add column type_calcul_score text check (type_calcul_score IN ('valeur_cible_seuil', 'presence_absence', 'progression'));
comment on column action_definition.type_calcul_score is 'Type de calcul automatique du score à partir d''un indicateur';

COMMIT;
