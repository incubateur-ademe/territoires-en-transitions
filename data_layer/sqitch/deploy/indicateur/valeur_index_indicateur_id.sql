-- Deploy tet:indicateur/valeur_index_indicateur_id to pg

create index concurrently if not exists indicateur_valeur_indicateur_id_idx
  on public.indicateur_valeur (indicateur_id);
