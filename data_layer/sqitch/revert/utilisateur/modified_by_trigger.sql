-- Revert tet:utilisateur/modified_by_trigger from pg

BEGIN;

drop function utilisateur.add_modified_by_trigger(table_schema text, table_name text);
drop function utilisateur.update_modified_by();

COMMIT;
