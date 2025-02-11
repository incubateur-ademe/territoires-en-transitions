-- Deploy tet:indicateur/fusion to pg

BEGIN;

create table if not exists public.indicateur_source_source_calcul (
  source_id text not null,
  source_calcul_id text not null,
  constraint fk_indicateur_source_source_entree_source_id
    foreign key (source_id)
    references public.indicateur_source (id)
    on delete cascade,
  constraint fk_indicateur_source_source_entree_source_calcul_id
    foreign key (source_calcul_id)
    references public.indicateur_source (id)
    on delete cascade,
  unique(source_id, source_calcul_id)
);

alter table public.indicateur_definition
  add column if not exists version varchar(16) not null default '1.0.0';

alter table public.indicateur_definition
  add column if not exists precision integer not null default 2;

drop table if exists indicateurs_json;

drop function if exists private.upsert_indicateurs_after_json_insert();

COMMIT;
