create schema if not exists reprise_tec;

create table if not exists reprise_tec.correspondance (
  table_cible text   not null,
  tec_id      bigint not null,
  tet_id      bigint not null,
  primary key (table_cible, tec_id)
);

-- Tranche 2 : d'où vient la date d'adoption d'un dossier publié (« suivi » ou
-- « repli »), pour retrouver les dossiers concernés si Q30 change.
alter table reprise_tec.correspondance
  add column if not exists adoption_decidee_par text;

create table if not exists reprise_tec.lignes_ecrites (
  table_cible text        not null,
  ligne_id    bigint      not null,
  ecrit_le    timestamptz not null default now()
);

create table if not exists reprise_tec.ecarts (
  table_source text        not null,
  tec_id       bigint      not null,
  motif        text        not null,
  ecarte_le    timestamptz not null default now(),
  primary key (table_source, tec_id)
);

-- Tranche 3 : une ligne T&C sans numéro, ou une partie seulement d'une ligne.
alter table reprise_tec.ecarts
  add column if not exists precision text not null default '';
alter table reprise_tec.ecarts
  drop constraint if exists ecarts_pkey,
  add constraint ecarts_pkey primary key (table_source, tec_id, precision);

comment on table reprise_tec.ecarts is
  'Ce que la reprise n''a pas écrit dans TeT, et pourquoi : une ligne par ligne '
  'de T&C laissée de côté (ou partie de ligne). Chaque motif est expliqué dans '
  'le README du script qui l''écrit.';
comment on column reprise_tec.ecarts.table_source is
  'La table de T&C d''où vient la ligne (sans le préfixe staging_).';
comment on column reprise_tec.ecarts.tec_id is
  'Le numéro de la ligne dans T&C ; celui du dossier pour une table sans numéro.';
comment on column reprise_tec.ecarts.precision is
  'Vide pour une ligne entière. Sinon, ce qui la repère dans une table sans '
  'numéro (« sol 2 », « periode 3 ») ou la partie écartée (« consommation », '
  'une colonne de commentaire).';
comment on column reprise_tec.ecarts.motif is
  'Pourquoi la ligne n''est pas dans TeT (doublon, valeur_vide…), voir le README.';
comment on column reprise_tec.ecarts.ecarte_le is
  'Quand l''écart a été inscrit.';
