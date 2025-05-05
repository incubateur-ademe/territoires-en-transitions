-- Deploy tet:plan_action/budget to pg

BEGIN;

-- Création de la table fiche_action_budget
create table fiche_action_budget
(
  id serial primary key,
  fiche_id integer not null references fiche_action on delete cascade,
  type text check (type IN ('investissement', 'fonctionnement')) not null,
  unite text check (unite IN ('HT', 'ETP')) not null,
  annee integer,
  budget_previsionnel numeric(12),
  budget_reel numeric(12),
  est_etale boolean not null default false
);
comment on column fiche_action_budget.annee is 'Null pour saisir le budget total';
comment on column fiche_action_budget.est_etale is 'Vrai si le budget total (annee = null) s''étale sur l''année';
comment on column fiche_action_budget.unite is 'HT = Hors Taxe, ETP = Équivalent Temps Plein';

-- Ajout d'index unique pour gérer les contraintes d'unicités
create unique index unique_fiche_action_budget_par_annee
  on fiche_action_budget (fiche_id, type, unite, annee)
  where (annee IS NOT NULL);

create unique index unique_fiche_action_budget_total
  on fiche_action_budget (fiche_id, type, unite)
  where (annee IS NULL);

-- Migration des valeurs budget_previsionnel actuelles de la fiche action
insert into fiche_action_budget (fiche_id, type, unite, annee, budget_previsionnel)
select id, 'investissement', 'HT', null, budget_previsionnel
from fiche_action
where budget_previsionnel is not null;

-- Information que la colonne budget_previsionnel de la fiche action est dépréciée
comment on column fiche_action.budget_previsionnel is 'deprecated';

COMMIT;
