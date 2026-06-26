-- Deploy tet:plan_action/plan_dates to pg

BEGIN;

alter table axe
  add column date_debut date,
  add column date_fin date;

comment on column axe.date_debut is 'Date de début de mise en œuvre du plan (uniquement renseignée sur le plan racine).';
comment on column axe.date_fin is 'Date de fin de mise en œuvre du plan (uniquement renseignée sur le plan racine).';

COMMIT;
