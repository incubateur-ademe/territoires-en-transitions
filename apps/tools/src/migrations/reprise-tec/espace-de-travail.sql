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
