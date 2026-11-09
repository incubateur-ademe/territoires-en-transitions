-- Revert tet:plan_action/fiche_action_index_parent_id from pg

drop index concurrently if exists public.fiche_action_parent_id_idx;
