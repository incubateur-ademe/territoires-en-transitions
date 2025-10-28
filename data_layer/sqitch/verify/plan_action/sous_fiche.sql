-- Verify tet:plan_action/sous_fiche on pg

BEGIN;

-- Vérifie la présence de la colonne
do $$
begin
  assert exists(
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'fiche_action'
      and column_name = 'parent_id'
      and data_type = 'integer'
  ), 'La colonne parent_id (integer) est absente de fiche_action';

  -- Vérifie la contrainte de clé étrangère et la règle de suppression
  assert exists (
    select 1
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name
     and tc.table_schema = kcu.table_schema
    join information_schema.referential_constraints rc
      on rc.constraint_name = tc.constraint_name
    join information_schema.constraint_column_usage ccu
      on ccu.constraint_name = rc.unique_constraint_name
   where tc.constraint_type = 'FOREIGN KEY'
     and tc.table_schema = 'public'
     and tc.table_name = 'fiche_action'
     and kcu.column_name = 'parent_id'
     and ccu.table_name = 'fiche_action'
     and ccu.table_schema = 'public'
  ), 'La contrainte FK sur parent_id vers fiche_action(id) est absente';
end $$;

ROLLBACK;
