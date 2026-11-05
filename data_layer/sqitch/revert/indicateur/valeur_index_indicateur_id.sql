-- Revert tet:indicateur/valeur_index_indicateur_id from pg

drop index concurrently if exists public.indicateur_valeur_indicateur_id_idx;
