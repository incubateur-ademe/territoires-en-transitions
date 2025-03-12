-- Deploy tet:indicateur/cible_et_seuil to pg

BEGIN;

alter table indicateur_definition add column expr_cible text;
comment on column indicateur_definition.expr_cible is 'Formule de calcul de la valeur cible';

alter table indicateur_definition add column expr_seuil text;
comment on column indicateur_definition.expr_seuil is 'Formule de calcul de la valeur seuil';

alter table indicateur_definition add column libelle_cible_seuil text;
comment on column indicateur_definition.libelle_cible_seuil is 'Informations complémentaires sur les valeurs cible/seuil';

create table indicateur_objectif
(
  indicateur_id integer references public.indicateur_definition on delete cascade not null,
  date_valeur date not null,
  formule text not null
);
comment on table indicateur_objectif is 'Objectifs associés aux indicateurs prédéfinis (supporte les formules)';
comment on column indicateur_objectif.formule is 'Formule de calcul de la valeur objectif';

create unique index unique_indicateur_objectif
    on indicateur_objectif (indicateur_id, date_valeur);

COMMIT;
