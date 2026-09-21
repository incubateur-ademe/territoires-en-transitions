-- Verify tet:indicateur/indicateur_collectivite_is_applicable on pg

BEGIN;

select is_applicable from indicateur_collectivite where false;

ROLLBACK;
