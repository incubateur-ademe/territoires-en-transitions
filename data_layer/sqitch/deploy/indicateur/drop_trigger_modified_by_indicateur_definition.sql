-- Deploy tet:indicateur/drop_trigger_modified_by_indicateur_definition to pg

BEGIN;

drop trigger IF EXISTS modified_by on indicateur_definition;

COMMIT;
