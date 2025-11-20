-- Verify tet:notes_complementaires_column_deletion on pg

BEGIN;

-- Verify that the notes_complementaires column has been removed
-- This query will fail if the column still exists
select
    id,
    titre,
    description
from fiche_action
where false;

-- Verify that the column does not exist by checking information_schema
do $$
begin
    if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'fiche_action'
          and column_name = 'notes_complementaires'
    ) then
        raise exception 'Column notes_complementaires still exists in fiche_action table';
    end if;
    
    if exists (
        select 1
        from information_schema.columns
        where table_schema = 'historique'
          and table_name = 'fiche_action'
          and column_name = 'notes_complementaires'
    ) then
        raise exception 'Column notes_complementaires still exists in historique.fiche_action table';
    end if;
    
    if exists (
        select 1
        from information_schema.columns
        where table_schema = 'historique'
          and table_name = 'fiche_action'
          and column_name = 'previous_notes_complementaires'
    ) then
        raise exception 'Column previous_notes_complementaires still exists in historique.fiche_action table';
    end if;
end $$;

ROLLBACK;
