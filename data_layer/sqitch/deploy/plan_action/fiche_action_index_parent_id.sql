-- Deploy tet:plan_action/fiche_action_index_parent_id to pg

create index concurrently if not exists fiche_action_parent_id_idx
  on public.fiche_action (parent_id)
  where parent_id is not null;
