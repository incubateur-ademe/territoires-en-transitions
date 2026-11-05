-- Verify tet:indicateur/valeur_index_indicateur_id on pg

BEGIN;

select 1 / count(*)
  from pg_indexes
 where schemaname = 'public'
   and tablename = 'indicateur_valeur'
   and indexname = 'indicateur_valeur_indicateur_id_idx';

ROLLBACK;
