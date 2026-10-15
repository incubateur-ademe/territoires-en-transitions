create schema if not exists reprise_tec;

create table if not exists reprise_tec.correspondance (
  table_cible text   not null,
  tec_id      bigint not null,
  tet_id      bigint not null,
  primary key (table_cible, tec_id)
);

create table if not exists reprise_tec.lignes_ecrites (
  table_cible text        not null,
  ligne_id    bigint      not null,
  ecrit_le    timestamptz not null default now()
);
